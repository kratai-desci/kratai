import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ClassInfo, PropertyInfo, MethodInfo, ClassRelationship } from '../../../types/domain';
import { AbstractParserStrategy } from './AbstractParserStrategy';

export class TypeScriptParser extends AbstractParserStrategy {
	supportedExtensions = ['.ts', '.tsx'];

	parseFile(filePath: string): ClassInfo[] {
		const classes: ClassInfo[] = [];

		try {
			const sourceCode = fs.readFileSync(filePath, 'utf-8');
			const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

			const visit = (node: ts.Node) => {
				if (ts.isClassDeclaration(node) && node.name) {
					classes.push(this.extractClassInfo(node, filePath));
				} else if (ts.isInterfaceDeclaration(node)) {
					classes.push(this.extractInterfaceInfo(node, filePath));
				} else if (ts.isFunctionDeclaration(node) && node.name) {
					// Extract standalone functions as modules
					classes.push(this.extractFunctionAsModule(node, sourceFile, filePath));
				}
				ts.forEachChild(node, visit);
			};

			// First pass: collect classes, interfaces, and functions
			visit(sourceFile);

			// Second pass: collect exported arrow functions and variables
			sourceFile.forEachChild(node => {
				if (ts.isVariableStatement(node)) {
					for (const declaration of node.declarationList.declarations) {
						if (ts.isIdentifier(declaration.name)) {
							if (declaration.initializer &&
								(ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
								classes.push(this.extractArrowFunctionAsModule(declaration, node, sourceFile, filePath));
							}
						}
					}
				}
			});

			// Fallback: if no classes/functions found, create a module info
			if (classes.length === 0) {
				const moduleInfo = this.extractModuleInfo(sourceFile, filePath);
				if (moduleInfo) {
					classes.push(moduleInfo);
				} else {
					// If still nothing found, but file has imports/exports, create a minimal module
					const hasImportsOrExports = this.hasImportsOrExports(sourceFile);
					if (hasImportsOrExports) {
						const fileName = path.basename(filePath, path.extname(filePath));
						classes.push({
							name: fileName,
							filePath,
							properties: [],
							methods: [],
							isModule: true,
							classType: 'module'
						});
					}
				}
			}
		} catch {
			// Return empty on parse error — never crash the extension
		}

		return classes;
	}

	private hasImportsOrExports(sourceFile: ts.SourceFile): boolean {
		let found = false;
		sourceFile.forEachChild(node => {
			if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
				found = true;
			}
		});
		return found;
	}

	extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];

		// Build map of className -> all ClassInfo with that name
		const classMap = new Map<string, ClassInfo[]>();
		classes.forEach(cls => {
			if (!classMap.has(cls.name)) {
				classMap.set(cls.name, []);
			}
			classMap.get(cls.name)!.push(cls);
		});

		for (const classInfo of classes) {
		const fromId = this.createClassId(classInfo);

		// 1. EXTENDS relationships
		if (classInfo.extends) {
			relationships.push(...this.createRelationshipsToTargets(
				classInfo, classInfo.extends, classMap, 'extends'
			));
		}
		// 2. IMPLEMENTS relationships
		if (classInfo.implements) {
			for (const iface of classInfo.implements) {
				relationships.push(...this.createRelationshipsToTargets(
					classInfo, iface, classMap, 'implements'
				));
			}
		}
		// 3. COMPOSITION relationships (property types)
		for (const prop of classInfo.properties) {
			this.extractTypeNames(prop.type).forEach(t => {
				if (allClassNames.has(t) && t !== classInfo.name) {
					relationships.push(...this.createRelationshipsToTargets(
						classInfo, t, classMap, 'composition'
					));
				}
			});
		}
		// 4. RETURNS relationships (method return types)
		for (const method of classInfo.methods) {
			this.extractTypeNames(method.returnType).forEach(t => {
				if (allClassNames.has(t) && t !== classInfo.name) {
					relationships.push(...this.createRelationshipsToTargets(
						classInfo, t, classMap, 'returns'
					));
				}
			});
		}
		// 5. PARAMETER relationships (method parameter types)
		for (const method of classInfo.methods) {
			for (const param of method.parameters) {
				this.extractTypeNames(param.type).forEach(t => {
					if (allClassNames.has(t) && t !== classInfo.name) {
						relationships.push(...this.createRelationshipsToTargets(
							classInfo, t, classMap, 'parameter'
						));
					}
				});
			}
		}

		// 6-10. Extract additional relationships from source file
		try {
				const absolutePath = path.isAbsolute(classInfo.filePath) 
					? classInfo.filePath 
					: path.join(workspacePath, classInfo.filePath);
				const sourceCode = fs.readFileSync(absolutePath, 'utf-8');
				const sourceFile = ts.createSourceFile(absolutePath, sourceCode, ts.ScriptTarget.Latest, true);

				// Extract: super calls, static calls, creates, imports, re-exports, async-calls, callbacks, generics
				const advancedRelationships = this.extractAdvancedRelationships(
					sourceFile, 
					classInfo, 
					allClassNames, 
					classMap
				);
				relationships.push(...advancedRelationships);

			} catch (error) {
				// Skip if file can't be read
			}
		}

		return relationships;
	}

	/**
	 * Extract advanced relationships: super calls, static calls, creates, imports, re-exports, async-calls, callbacks, generics
	 */
	private extractAdvancedRelationships(
		sourceFile: ts.SourceFile,
		classInfo: ClassInfo,
		allClassNames: Set<string>,
		classMap: Map<string, ClassInfo[]>
	): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		const fromId = this.createClassId(classInfo);

		const visitNode = (node: ts.Node) => {
			// 1. CALLS-SUPER: super.method() or super() calls
			if (ts.isCallExpression(node)) {
				if (ts.isPropertyAccessExpression(node.expression) && 
					node.expression.expression.kind === ts.SyntaxKind.SuperKeyword) {
					// super.method() call
					if (classInfo.extends) {
						relationships.push(...this.createRelationshipsToTargets(
							classInfo, classInfo.extends, classMap, 'calls-super'
						));
					}
				} else if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
					// super() constructor call
					if (classInfo.extends) {
						relationships.push(...this.createRelationshipsToTargets(
							classInfo, classInfo.extends, classMap, 'calls-super'
						));
					}
				}

				// 2. CALLS-STATIC: ClassName.staticMethod() calls
				if (ts.isPropertyAccessExpression(node.expression) && 
					ts.isIdentifier(node.expression.expression)) {
					const className = node.expression.expression.getText();
					if (allClassNames.has(className)) {
						relationships.push(...this.createRelationshipsToTargets(
							classInfo, className, classMap, 'calls-static'
						));
					}
				}

				// 3. CALLS: Regular function calls (function-to-function)
				if (ts.isIdentifier(node.expression)) {
					const funcName = node.expression.getText();
					if (allClassNames.has(funcName) && funcName !== classInfo.name) {
						relationships.push(...this.createRelationshipsToTargets(
							classInfo, funcName, classMap, 'calls',
							(target) => target.isModule === true
						));
					}
				}
			}

			// 4. CREATES: new ClassName() expressions (factory patterns)
			if (ts.isNewExpression(node) && ts.isIdentifier(node.expression)) {
				const className = node.expression.getText();
				if (allClassNames.has(className)) {
					relationships.push(...this.createRelationshipsToTargets(
						classInfo, className, classMap, 'creates'
					));
				}
			}

			// 5. ASYNC-CALLS: await expressions
			if (ts.isAwaitExpression(node) && ts.isCallExpression(node.expression)) {
				const callExpr = node.expression;
				if (ts.isIdentifier(callExpr.expression)) {
					const funcName = callExpr.expression.getText();
					if (allClassNames.has(funcName)) {
						relationships.push(...this.createRelationshipsToTargets(
							classInfo, funcName, classMap, 'async-calls',
							(target) => target.isModule === true
						));
					}
				}
			}

			// 6. CALLBACK: Higher-order function parameters
			if (ts.isCallExpression(node)) {
				node.arguments.forEach(arg => {
					if (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) {
						// This call passes a callback
						if (ts.isIdentifier(node.expression)) {
							const funcName = node.expression.getText();
							if (allClassNames.has(funcName)) {
								relationships.push(...this.createRelationshipsToTargets(
									classInfo, funcName, classMap, 'callback',
									(target) => target.isModule === true
								));
							}
						}
					}
				});
			}

			ts.forEachChild(node, visitNode);
		};

		// 7. IMPORTS: import statements (detect all imports, not just those in allClassNames)
		sourceFile.forEachChild(node => {
			if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
				const importPath = node.moduleSpecifier.text;
				if (importPath.startsWith('.') || importPath.startsWith('@/')) {
					if (node.importClause) {
						// Named imports
						if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
							node.importClause.namedBindings.elements.forEach(element => {
								const importedName = element.name.getText();
								const rels = this.createRelationshipsToTargets(
									classInfo, importedName, classMap, 'imports'
								);
								if (rels.length > 0) {
									relationships.push(...rels);
								} else {
									// Target not in classMap (from unparsed file) - use placeholder
									relationships.push({ from: fromId, to: `__unknown__${importedName}`, type: 'imports' });
								}
							});
						}
						// Default import
						if (node.importClause.name) {
							const importedName = node.importClause.name.getText();
							const rels = this.createRelationshipsToTargets(
								classInfo, importedName, classMap, 'imports'
							);
							if (rels.length > 0) {
								relationships.push(...rels);
							} else {
								// Target not in classMap (from unparsed file) - use placeholder
								relationships.push({ from: fromId, to: `__unknown__${importedName}`, type: 'imports' });
							}
						}
					}
				}
			}

			// 8. RE-EXPORTS: export { X } from './module'
			if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
				const exportPath = node.moduleSpecifier.text;
				if (exportPath.startsWith('.') || exportPath.startsWith('@/')) {
					if (node.exportClause && ts.isNamedExports(node.exportClause)) {
						node.exportClause.elements.forEach(element => {
							const exportedName = element.name.getText();
							const rels = this.createRelationshipsToTargets(
								classInfo, exportedName, classMap, 're-exports'
							);
							if (rels.length > 0) {
								relationships.push(...rels);
							} else {
								// Target not in classMap (from unparsed file) - use placeholder
								relationships.push({ from: fromId, to: `__unknown__${exportedName}`, type: 're-exports' });
							}
						});
					}
				}
			}
		});

		// 9. GENERIC: Generic type parameters and references
		const extractGenerics = (node: ts.Node) => {
			// Detect generic type parameters with constraints
			if (ts.isClassDeclaration(node) && node.typeParameters) {
				node.typeParameters.forEach(typeParam => {
					if (typeParam.constraint) {
						const constraintText = typeParam.constraint.getText();
						this.extractTypeNames(constraintText).forEach(t => {
							if (allClassNames.has(t)) {
								relationships.push(...this.createRelationshipsToTargets(
									classInfo, t, classMap, 'generic'
								));
							}
						});
					}
				});
			}
			
			// Detect function generic parameters
			if ((ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) && node.typeParameters) {
				node.typeParameters.forEach(typeParam => {
					if (typeParam.constraint) {
						const constraintText = typeParam.constraint.getText();
						this.extractTypeNames(constraintText).forEach(t => {
							if (allClassNames.has(t)) {
								relationships.push(...this.createRelationshipsToTargets(
									classInfo, t, classMap, 'generic'
								));
							}
						});
					}
				});
			}
			
			// Detect method generic parameters
			if (ts.isMethodDeclaration(node) && node.typeParameters) {
				node.typeParameters.forEach(typeParam => {
					if (typeParam.constraint) {
						const constraintText = typeParam.constraint.getText();
						this.extractTypeNames(constraintText).forEach(t => {
							if (allClassNames.has(t)) {
								relationships.push(...this.createRelationshipsToTargets(
									classInfo, t, classMap, 'generic'
								));
							}
						});
					}
				});
			}
			
			// Detect generic type references in parameter types (e.g., users: User[], Repository<User>)
			if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
				node.parameters.forEach(param => {
					if (param.type) {
						const typeText = param.type.getText();
						// Extract types from generic usage like User[], Repository<User>, etc.
						this.extractTypeNames(typeText).forEach(t => {
							if (allClassNames.has(t) && t !== classInfo.name) {
								relationships.push(...this.createRelationshipsToTargets(
									classInfo, t, classMap, 'generic'
								));
							}
						});
					}
				});
				
				// Check return type for generic references
				if (node.type) {
					const returnTypeText = node.type.getText();
					this.extractTypeNames(returnTypeText).forEach(t => {
						if (allClassNames.has(t) && t !== classInfo.name) {
							relationships.push(...this.createRelationshipsToTargets(
								classInfo, t, classMap, 'generic'
							));
						}
					});
				}
			}
			
			ts.forEachChild(node, extractGenerics);
		};

		// Visit the source file to extract all relationships
		sourceFile.forEachChild(node => {
			visitNode(node);
			extractGenerics(node);
		});

		return relationships;
	}

	private extractModuleLevelInstantiations(filePath: string, allClassNames: Set<string>, workspacePath: string): Set<string> {
		const instantiatedClasses = new Set<string>();

		try {
			// Construct absolute path (filePath is workspace-relative)
			const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(workspacePath, filePath);
			const sourceCode = fs.readFileSync(absolutePath, 'utf-8');
			const sourceFile = ts.createSourceFile(absolutePath, sourceCode, ts.ScriptTarget.Latest, true);

			// First pass: Extract imported names and their source files
			const importedClasses = this.extractImports(sourceFile, absolutePath, allClassNames, workspacePath);
			console.log(`🔗 [${path.basename(filePath)}] Found imports:`, Array.from(importedClasses));
			
			// Add imported classes to dependencies
			importedClasses.forEach(className => instantiatedClasses.add(className));

			const visitNode = (node: ts.Node) => {
				// Look for 'new ClassName()' expressions
				if (ts.isNewExpression(node) && ts.isIdentifier(node.expression)) {
					const className = node.expression.getText();
					console.log(`🐰 Found 'new ${className}()' in ${path.basename(filePath)}`);
					if (allClassNames.has(className)) {
						console.log(`🐰   ✅ ${className} is a known class, adding relationship`);
						instantiatedClasses.add(className);
					} else {
						console.log(`🐰   ❌ ${className} not in allClassNames`);
					}
				}
				// Recursively visit all children to find nested new expressions
				ts.forEachChild(node, visitNode);
			};

			// Scan all module-level statements (variable declarations, function bodies, etc.)
			sourceFile.forEachChild(node => {
				// Skip class declarations - we already handle those separately
				if (!ts.isClassDeclaration(node)) {
					visitNode(node);
				}
			});
		} catch (error) {
			console.log(`🐰 Error parsing ${path.basename(filePath)}:`, error);
		}

		return instantiatedClasses;
	}

	/**
	 * Extract imported class names from a source file
	 */
	private extractImports(sourceFile: ts.SourceFile, currentFilePath: string, allClassNames: Set<string>, workspacePath: string): Set<string> {
		const importedClasses = new Set<string>();

		sourceFile.forEachChild(node => {
			// Handle: import { Database, User } from './lib/db'
			if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
				const importPath = node.moduleSpecifier.text;
				
				// Skip node_modules imports (react, next, etc.)
				if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
					return;
				}

				// Get imported names
				if (node.importClause) {
					// Named imports: import { Database, User } from './db'
					if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
						node.importClause.namedBindings.elements.forEach(element => {
							const importedName = element.name.getText();
							// Check if this is a known class
							if (allClassNames.has(importedName)) {
								console.log(`  🔗 Imported class: ${importedName} from ${importPath}`);
								importedClasses.add(importedName);
							}
						});
					}

					// Default import: import Database from './db'
					if (node.importClause.name) {
						const importedName = node.importClause.name.getText();
						if (allClassNames.has(importedName)) {
							console.log(`  🔗 Imported class (default): ${importedName} from ${importPath}`);
							importedClasses.add(importedName);
						}
					}
				}
			}
		});

		return importedClasses;
	}

	private extractTypeNames(typeString: string): string[] {
		const nonClassTypes = new Set([
			'string', 'number', 'boolean', 'void', 'any', 'unknown',
			'never', 'null', 'undefined', 'Promise', 'Array', 'Map', 'Set'
		]);
		const types: string[] = [];
		const identifierRegex = /\b([A-Z][a-zA-Z0-9]*)\b/g;
		let match;
		while ((match = identifierRegex.exec(typeString)) !== null) {
			if (!nonClassTypes.has(match[1])) { types.push(match[1]); }
		}
		return types;
	}

	private extractClassInfo(node: ts.ClassDeclaration, filePath: string): ClassInfo {
		const name = node.name?.getText() || 'Anonymous';
		const properties: PropertyInfo[] = [];
		const methods: MethodInfo[] = [];
		let extendsClass: string | undefined;
		const implementsInterfaces: string[] = [];

		if (node.heritageClauses) {
			for (const clause of node.heritageClauses) {
				if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
					extendsClass = clause.types[0]?.expression.getText();
				} else if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
					for (const type of clause.types) {
						implementsInterfaces.push(type.expression.getText());
					}
				}
			}
		}

		for (const member of node.members) {
			if (ts.isPropertyDeclaration(member)) {
				properties.push(this.extractProperty(member));
			} else if (ts.isMethodDeclaration(member)) {
				methods.push(this.extractMethod(member));
			} else if (ts.isConstructorDeclaration(member)) {
				methods.push(this.extractConstructor(member));
				// Extract properties from constructor parameters (e.g., constructor(private repo: UserRepository))
				member.parameters.forEach(param => {
					const hasVisibilityModifier = param.modifiers?.some(m => 
						m.kind === ts.SyntaxKind.PublicKeyword ||
						m.kind === ts.SyntaxKind.PrivateKeyword ||
						m.kind === ts.SyntaxKind.ProtectedKeyword ||
						m.kind === ts.SyntaxKind.ReadonlyKeyword
					);
					if (hasVisibilityModifier && ts.isIdentifier(param.name)) {
						const sourceFile = node.getSourceFile();
						properties.push({
							name: param.name.getText(),
							type: param.type?.getText() || 'any',
							visibility: param.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword) ? 'private' :
										param.modifiers?.some(m => m.kind === ts.SyntaxKind.ProtectedKeyword) ? 'protected' : 'public',
							isStatic: false,
							isReadonly: param.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword) || false,
							lineNumber: sourceFile?.getLineAndCharacterOfPosition(param.getStart()).line + 1,
							endLineNumber: sourceFile?.getLineAndCharacterOfPosition(param.getEnd()).line + 1,
						});
					}
				});
			}
		}

		const isAbstract = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AbstractKeyword) || false;
		return {
			name, filePath, properties, methods,
			extends: extendsClass,
			implements: implementsInterfaces.length > 0 ? implementsInterfaces : undefined,
			isAbstract,
			classType: isAbstract ? 'abstract' : 'class'
		};
	}

	private extractInterfaceInfo(node: ts.InterfaceDeclaration, filePath: string): ClassInfo {
		const name = node.name.getText();
		const properties: PropertyInfo[] = [];
		const methods: MethodInfo[] = [];
		const implementsInterfaces: string[] = [];

		if (node.heritageClauses) {
			for (const clause of node.heritageClauses) {
				for (const type of clause.types) {
					implementsInterfaces.push(type.expression.getText());
				}
			}
		}

		for (const member of node.members) {
			if (ts.isPropertySignature(member)) {
				properties.push(this.extractPropertySignature(member));
			} else if (ts.isMethodSignature(member)) {
				methods.push(this.extractMethodSignature(member));
			}
		}

		return {
			name, filePath, properties, methods,
			implements: implementsInterfaces.length > 0 ? implementsInterfaces : undefined,
			isInterface: true,
			classType: 'interface'
		};
	}

	private extractProperty(node: ts.PropertyDeclaration): PropertyInfo {
		const sourceFile = node.getSourceFile();
		return {
			name: node.name.getText(),
			type: node.type?.getText() || 'any',
			visibility: this.getVisibility(node),
			isStatic: node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) || false,
			isReadonly: node.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword) || false,
			lineNumber: sourceFile?.getLineAndCharacterOfPosition(node.getStart()).line + 1,
			endLineNumber: sourceFile?.getLineAndCharacterOfPosition(node.getEnd()).line + 1,
		};
	}

	private extractPropertySignature(node: ts.PropertySignature): PropertyInfo {
		const sourceFile = node.getSourceFile();
		return {
			name: node.name.getText(),
			type: node.type?.getText() || 'any',
			visibility: 'public',
			lineNumber: sourceFile?.getLineAndCharacterOfPosition(node.getStart()).line + 1,
			endLineNumber: sourceFile?.getLineAndCharacterOfPosition(node.getEnd()).line + 1,
		};
	}

	private extractMethod(node: ts.MethodDeclaration): MethodInfo {
		const sourceFile = node.getSourceFile();
		return {
			name: node.name.getText(),
			parameters: node.parameters.map(p => ({
				name: p.name.getText(),
				type: p.type?.getText() || 'any',
				optional: !!p.questionToken
			})),
			returnType: node.type?.getText() || 'void',
			visibility: this.getVisibility(node),
			isStatic: node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) || false,
			isAsync: node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false,
			lineNumber: sourceFile?.getLineAndCharacterOfPosition(node.getStart()).line + 1,
			endLineNumber: sourceFile?.getLineAndCharacterOfPosition(node.getEnd()).line + 1,
		};
	}

	private extractMethodSignature(node: ts.MethodSignature): MethodInfo {
		const sourceFile = node.getSourceFile();
		return {
			name: node.name.getText(),
			parameters: node.parameters.map(p => ({
				name: p.name.getText(),
				type: p.type?.getText() || 'any',
				optional: !!p.questionToken
			})),
			returnType: node.type?.getText() || 'void',
			visibility: 'public',
			lineNumber: sourceFile?.getLineAndCharacterOfPosition(node.getStart()).line + 1,
			endLineNumber: sourceFile?.getLineAndCharacterOfPosition(node.getEnd()).line + 1,
		};
	}

	private extractConstructor(node: ts.ConstructorDeclaration): MethodInfo {
		const sourceFile = node.getSourceFile();
		return {
			name: 'constructor',
			parameters: node.parameters.map(p => ({
				name: p.name.getText(),
				type: p.type?.getText() || 'any',
				optional: !!p.questionToken
			})),
			returnType: 'void',
			visibility: 'public',
			lineNumber: sourceFile?.getLineAndCharacterOfPosition(node.getStart()).line + 1,
			endLineNumber: sourceFile?.getLineAndCharacterOfPosition(node.getEnd()).line + 1,
		};
	}

	private extractModuleInfo(sourceFile: ts.SourceFile, filePath: string): ClassInfo | null {
		const fileName = path.basename(filePath, path.extname(filePath));
		const moduleName = `[${fileName}]`;
		const properties: PropertyInfo[] = [];
		const methods: MethodInfo[] = [];

		sourceFile.forEachChild(node => {
			if (ts.isFunctionDeclaration(node) && node.name) {
				const isExported = node.modifiers?.some(
					m => m.kind === ts.SyntaxKind.ExportKeyword || m.kind === ts.SyntaxKind.DefaultKeyword
				);
				if (isExported) {
					methods.push({
						name: node.name.getText(),
						parameters: node.parameters.map(p => ({
							name: p.name.getText(),
							type: p.type?.getText() || 'any',
							optional: !!p.questionToken
						})),
						returnType: node.type?.getText() || 'void',
						visibility: 'public',
						isStatic: true,
						lineNumber: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
						endLineNumber: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1
					});
				}
			}

			if (ts.isVariableStatement(node)) {
				const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
				for (const declaration of node.declarationList.declarations) {
					if (ts.isIdentifier(declaration.name)) {
						const name = declaration.name.getText();
						const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
						if (declaration.initializer &&
							(ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
							if (isExported) {
								const funcNode = declaration.initializer;
								methods.push({
									name,
									parameters: funcNode.parameters.map(p => ({
										name: p.name.getText(),
										type: p.type?.getText() || 'any',
										optional: !!p.questionToken
									})),
									returnType: funcNode.type?.getText() || (name.match(/^[A-Z]/) ? 'JSX.Element' : 'any'),
									visibility: 'public',
									isStatic: true,
									lineNumber: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
									endLineNumber: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1
								});
							}
						} else if (isExported) {
							properties.push({
								name,
								type: declaration.type?.getText() || 'inferred',
								visibility: 'public',
								isStatic: true,
								isReadonly: isConst,
								lineNumber: sourceFile.getLineAndCharacterOfPosition(declaration.getStart()).line + 1,
								endLineNumber: sourceFile.getLineAndCharacterOfPosition(declaration.getEnd()).line + 1
							});
						}
					}
				}
			}
		});

		if (properties.length === 0 && methods.length === 0) { return null; }
		return { name: moduleName, filePath, properties, methods, isModule: true, classType: 'module' };
	}

	private getVisibility(node: ts.PropertyDeclaration | ts.MethodDeclaration): 'public' | 'private' | 'protected' {
		if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword)) { return 'private'; }
		if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ProtectedKeyword)) { return 'protected'; }
		return 'public';
	}

	/**
	 * Extract a standalone function declaration as a module
	 */
	private extractFunctionAsModule(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile, filePath: string): ClassInfo {
		const name = node.name!.getText();
		const methods: MethodInfo[] = [{
			name,
			parameters: node.parameters.map(p => ({
				name: p.name.getText(),
				type: p.type?.getText() || 'any',
				optional: !!p.questionToken
			})),
			returnType: node.type?.getText() || 'void',
			visibility: 'public',
			isStatic: false,
			isAsync: !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword),
			lineNumber: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
			endLineNumber: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1
		}];

		return {
			name,
			filePath,
			properties: [],
			methods,
			isModule: true,
			classType: 'module'
		};
	}

	/**
	 * Extract an arrow function or function expression as a module
	 */
	private extractArrowFunctionAsModule(
		declaration: ts.VariableDeclaration,
		statement: ts.VariableStatement,
		sourceFile: ts.SourceFile,
		filePath: string
	): ClassInfo {
		const name = (declaration.name as ts.Identifier).getText();
		const funcNode = declaration.initializer as ts.ArrowFunction | ts.FunctionExpression;
		
		const methods: MethodInfo[] = [{
			name,
			parameters: funcNode.parameters.map(p => ({
				name: p.name.getText(),
				type: p.type?.getText() || 'any',
				optional: !!p.questionToken
			})),
			returnType: funcNode.type?.getText() || 'any',
			visibility: 'public',
			isStatic: false,
			isAsync: !!funcNode.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword),
			lineNumber: sourceFile.getLineAndCharacterOfPosition(statement.getStart()).line + 1,
			endLineNumber: sourceFile.getLineAndCharacterOfPosition(statement.getEnd()).line + 1
		}];

		return {
			name,
			filePath,
			properties: [],
			methods,
			isModule: true,
			classType: 'module'
		};
	}
}
