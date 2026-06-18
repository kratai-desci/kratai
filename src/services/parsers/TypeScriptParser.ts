import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ClassInfo, PropertyInfo, MethodInfo, ClassRelationship } from '../../types/diagram';
import { IParserStrategy } from './IParserStrategy';

export class TypeScriptParser implements IParserStrategy {
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
				}
				ts.forEachChild(node, visit);
			};

			visit(sourceFile);

			if (classes.length === 0) {
				const moduleInfo = this.extractModuleInfo(sourceFile, filePath);
				if (moduleInfo) {
					classes.push(moduleInfo);
				}
			}
		} catch {
			// Return empty on parse error — never crash the extension
		}

		return classes;
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
			const fromId = `${classInfo.filePath}__${classInfo.name}`;

			// Extract module-level instantiations (for Next.js routes, etc.)
			if (classInfo.isModule || classInfo.classType === 'module') {
				const moduleLevelDeps = this.extractModuleLevelInstantiations(classInfo.filePath, allClassNames, workspacePath);
				console.log(`🐰 [${classInfo.name}] Found module-level instantiations:`, Array.from(moduleLevelDeps));
				moduleLevelDeps.forEach(dep => {
					const targets = classMap.get(dep) || [];
					console.log(`🐰 Creating relationship from ${classInfo.name} to ${dep} (${targets.length} targets)`);
					targets.forEach(target => {
						const toId = `${target.filePath}__${target.name}`;
						relationships.push({ from: fromId, to: toId, type: 'uses' });
					});
				});
			}

			if (classInfo.extends) {
				const targets = classMap.get(classInfo.extends) || [];
				targets.forEach(target => {
					const toId = `${target.filePath}__${target.name}`;
					relationships.push({ from: fromId, to: toId, type: 'extends' });
				});
			}

			if (classInfo.implements) {
				for (const iface of classInfo.implements) {
					const targets = classMap.get(iface) || [];
					targets.forEach(target => {
						const toId = `${target.filePath}__${target.name}`;
						relationships.push({ from: fromId, to: toId, type: 'implements' });
					});
				}
			}

			const dependencies = new Set<string>();

			for (const prop of classInfo.properties) {
				this.extractTypeNames(prop.type).forEach(t => {
					if (allClassNames.has(t) && t !== classInfo.name) { dependencies.add(t); }
				});
			}

			for (const method of classInfo.methods) {
				for (const param of method.parameters) {
					this.extractTypeNames(param.type).forEach(t => {
						if (allClassNames.has(t) && t !== classInfo.name) { dependencies.add(t); }
					});
				}
				this.extractTypeNames(method.returnType).forEach(t => {
					if (allClassNames.has(t) && t !== classInfo.name) { dependencies.add(t); }
				});
			}

			dependencies.forEach(dep => {
				const targets = classMap.get(dep) || [];
				targets.forEach(target => {
					const toId = `${target.filePath}__${target.name}`;
					const hasStronger = relationships.some(
						r => r.from === fromId && r.to === toId &&
							(r.type === 'extends' || r.type === 'implements')
					);
					if (!hasStronger) {
						relationships.push({ from: fromId, to: toId, type: 'uses' });
					}
				});
			});
		}

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
}
