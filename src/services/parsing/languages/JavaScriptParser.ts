import * as fs from 'fs';
import * as path from 'path';
import { ClassInfo, PropertyInfo, MethodInfo, ClassRelationship } from '../../../types/domain';
import { AbstractParserStrategy } from './AbstractParserStrategy';

// Uses the TypeScript compiler API with allowJs — no extra deps needed
import * as ts from 'typescript';

export class JavaScriptParser extends AbstractParserStrategy {
	supportedExtensions = ['.js', '.jsx'];

	parseFile(filePath: string): ClassInfo[] {
		const classes: ClassInfo[] = [];

		try {
			const sourceCode = fs.readFileSync(filePath, 'utf-8');

			// Create a program with checkJs enabled to parse JSDoc types
			const compilerOptions: ts.CompilerOptions = {
				allowJs: true,
				checkJs: true,
				noEmit: true,
				target: ts.ScriptTarget.Latest
			};

			const host = ts.createCompilerHost(compilerOptions);
			const originalGetSourceFile = host.getSourceFile;
			host.getSourceFile = (fileName, languageVersion) => {
				if (fileName === filePath) {
					return ts.createSourceFile(
						fileName,
						sourceCode,
						languageVersion,
						true,
						filePath.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.JS
					);
				}
				return originalGetSourceFile(fileName, languageVersion);
			};

			const program = ts.createProgram([filePath], compilerOptions, host);
			const sourceFile = program.getSourceFile(filePath);
			
			if (!sourceFile) {
				return classes;
			}

			const typeChecker = program.getTypeChecker();

			const visit = (node: ts.Node) => {
				// ES6 class declarations
				if (ts.isClassDeclaration(node) && node.name) {
					classes.push(this.extractClassInfo(node, filePath, typeChecker));
				}
				// Class expressions assigned to variables: const Foo = class { ... }
				else if (ts.isVariableDeclaration(node) &&
					node.initializer && ts.isClassExpression(node.initializer) &&
					ts.isIdentifier(node.name)) {
					classes.push(this.extractClassExpressionInfo(
						node.name.getText(), node.initializer, filePath, typeChecker
					));
				}
				ts.forEachChild(node, visit);
			};

			visit(sourceFile);

			// Always check for module-level functions (even if classes exist)
			const moduleInfo = this.extractModuleInfo(sourceFile, filePath);
			if (moduleInfo) {
				classes.push(moduleInfo);
			}
		} catch {
			// Return empty on parse error — never crash
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

			// Inheritance relationships
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

			// Property type dependencies (composition)
			const dependencies = new Set<string>();

			for (const prop of classInfo.properties) {
				const typeNames = this.extractTypeNames(prop.type);
				typeNames.forEach(t => {
					if (allClassNames.has(t) && t !== classInfo.name) { 
						dependencies.add(t); 
					}
				});
			}

			// Method parameter and return type dependencies
			for (const method of classInfo.methods) {
				for (const param of method.parameters) {
					const typeNames = this.extractTypeNames(param.type);
					typeNames.forEach(t => {
						// Create parameter relationships for all types (not just classes in allClassNames)
						// because JSDoc typedefs might not be in allClassNames
						if (t && t !== classInfo.name && t !== 'any') {
							const targets = classMap.get(t) || [];
							if (targets.length > 0) {
								targets.forEach(target => {
									const toId = `${target.filePath}__${target.name}`;
									relationships.push({ from: fromId, to: toId, type: 'parameter' });
								});
							} else {
								// Type might be a typedef or external type, create relationship anyway
								// using a synthetic ID for the type
								relationships.push({ 
									from: fromId, 
									to: `${classInfo.filePath}__${t}`, 
									type: 'parameter' 
								});
							}
						}
					});
				}
				
				if (method.returnType) {
					const typeNames = this.extractTypeNames(method.returnType);
					typeNames.forEach(t => {
						// Create returns relationships for all types (not just classes in allClassNames)
						if (t && t !== classInfo.name && t !== 'any') {
							const targets = classMap.get(t) || [];
							if (targets.length > 0) {
								targets.forEach(target => {
									const toId = `${target.filePath}__${target.name}`;
									relationships.push({ from: fromId, to: toId, type: 'returns' });
								});
							} else {
								// Type might be a typedef or external type, create relationship anyway
								relationships.push({ 
									from: fromId, 
									to: `${classInfo.filePath}__${t}`, 
									type: 'returns' 
								});
							}
						}
					});
				}
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

			// Extract method call relationships by parsing the file again
			relationships.push(...this.extractMethodCallRelationships(classInfo, allClassNames, classMap));
		}

		return relationships;
	}

	private extractMethodCallRelationships(
		classInfo: ClassInfo, 
		allClassNames: Set<string>,
		classMap: Map<string, ClassInfo[]>
	): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];

		try {
			const sourceCode = fs.readFileSync(classInfo.filePath, 'utf-8');
			const sourceFile = ts.createSourceFile(
				classInfo.filePath,
				sourceCode,
				ts.ScriptTarget.Latest,
				true,
				ts.ScriptKind.JS
			);

			// For module functions, extract intra-module call relationships
			if (classInfo.isModule === true && (classInfo as any)._functionNodes) {
				const functionNodes = (classInfo as any)._functionNodes as Map<string, ts.Node>;
				const functionNames = new Set(classInfo.methods.map(m => m.name));
				
				// For each function, scan its body for calls to other functions
				for (const [funcName, funcNode] of functionNodes.entries()) {
					const visitFunctionBody = (node: ts.Node) => {
						if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
							const calledFuncName = node.expression.getText();
							// Check if it's calling another function in this module
							if (functionNames.has(calledFuncName) && calledFuncName !== funcName) {
								const fromId = `${classInfo.filePath}__${funcName}`;
								const toId = `${classInfo.filePath}__${calledFuncName}`;
								relationships.push({ from: fromId, to: toId, type: 'calls' });
							}
						}
						
						// Check for await calls
						if (ts.isAwaitExpression(node) && ts.isCallExpression(node.expression)) {
							const callExpr = node.expression;
							if (ts.isIdentifier(callExpr.expression)) {
								const calledFuncName = callExpr.expression.getText();
								if (functionNames.has(calledFuncName) && calledFuncName !== funcName) {
									const fromId = `${classInfo.filePath}__${funcName}`;
									const toId = `${classInfo.filePath}__${calledFuncName}`;
									relationships.push({ from: fromId, to: toId, type: 'async-calls' });
								}
							}
						}
						
						ts.forEachChild(node, visitFunctionBody);
					};
					
					ts.forEachChild(funcNode, visitFunctionBody);
				}
				
				return relationships; // For modules, only return intra-module relationships
			}

			const visitNode = (node: ts.Node) => {
				// 1. CALLS-SUPER: super.method() or super() calls
				if (ts.isCallExpression(node)) {
					if (ts.isPropertyAccessExpression(node.expression) && 
						node.expression.expression.kind === ts.SyntaxKind.SuperKeyword) {
						// super.method() call
						if (classInfo.extends) {
							const targets = classMap.get(classInfo.extends) || [];
							targets.forEach(target => {
								const fromId = `${classInfo.filePath}__${classInfo.name}`;
								const toId = `${target.filePath}__${target.name}`;
								relationships.push({ from: fromId, to: toId, type: 'calls-super' });
							});
						}
					} else if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
						// super() constructor call
						if (classInfo.extends) {
							const targets = classMap.get(classInfo.extends) || [];
							targets.forEach(target => {
								const fromId = `${classInfo.filePath}__${classInfo.name}`;
								const toId = `${target.filePath}__${target.name}`;
								relationships.push({ from: fromId, to: toId, type: 'calls-super' });
							});
						}
					}

					// 2. CALLS-STATIC: ClassName.staticMethod() calls
					if (ts.isPropertyAccessExpression(node.expression) && 
						ts.isIdentifier(node.expression.expression)) {
						const className = node.expression.expression.getText();
						if (allClassNames.has(className)) {
							const targets = classMap.get(className) || [];
							targets.forEach(target => {
								const fromId = `${classInfo.filePath}__${classInfo.name}`;
								const toId = `${target.filePath}__${target.name}`;
								relationships.push({ from: fromId, to: toId, type: 'calls-static' });
							});
						}
					}

					// 3. CALLS: Regular function calls (function-to-function)
					if (ts.isIdentifier(node.expression)) {
						const funcName = node.expression.getText();
						if (funcName !== classInfo.name) {
							// Check if the function is a method in any module
							for (const [name, targets] of classMap.entries()) {
								for (const target of targets) {
									if (target.isModule === true) {
										// Check if this module has a method with funcName
										const hasMethod = target.methods?.some(m => m.name === funcName);
										if (hasMethod) {
											const fromId = `${classInfo.filePath}__${classInfo.name}`;
											const toId = `${target.filePath}__${target.name}`;
											relationships.push({ from: fromId, to: toId, type: 'calls' });
											break; // Found it, no need to check other targets
										}
									}
								}
							}
						}
					}
				}

				// 4. ASYNC-CALLS: await expressions
				if (ts.isAwaitExpression(node) && ts.isCallExpression(node.expression)) {
					const callExpr = node.expression;
					if (ts.isIdentifier(callExpr.expression)) {
						const funcName = callExpr.expression.getText();
						// Check if the function is a method in any module
						for (const [name, targets] of classMap.entries()) {
							for (const target of targets) {
								if (target.isModule === true) {
									// Check if this module has a method with funcName
									const hasMethod = target.methods?.some(m => m.name === funcName);
									if (hasMethod) {
										const fromId = `${classInfo.filePath}__${classInfo.name}`;
										const toId = `${target.filePath}__${target.name}`;
										relationships.push({ from: fromId, to: toId, type: 'async-calls' });
										break; // Found it, no need to check other targets
									}
								}
							}
						}
					}
				}

				ts.forEachChild(node, visitNode);
			};

			visitNode(sourceFile);
		} catch (error) {
			// Silently fail if we can't parse the file
		}

		return relationships;
	}

	private extractClassInfo(node: ts.ClassDeclaration, filePath: string, typeChecker?: ts.TypeChecker): ClassInfo {
		const name = node.name?.getText() || 'Anonymous';
		return this.extractClassMembers(name, node, filePath, typeChecker);
	}

	private extractClassExpressionInfo(
		name: string,
		node: ts.ClassExpression,
		filePath: string,
		typeChecker?: ts.TypeChecker
	): ClassInfo {
		return this.extractClassMembers(name, node, filePath, typeChecker);
	}

	private extractClassMembers(
		name: string,
		node: ts.ClassDeclaration | ts.ClassExpression,
		filePath: string,
		typeChecker?: ts.TypeChecker
	): ClassInfo {
		const properties: PropertyInfo[] = [];
		const methods: MethodInfo[] = [];
		let extendsClass: string | undefined;

		if (node.heritageClauses) {
			for (const clause of node.heritageClauses) {
				if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
					extendsClass = clause.types[0]?.expression.getText();
				}
			}
		}

		for (const member of node.members) {
			if (ts.isPropertyDeclaration(member) && member.name) {
				const sourceFile = member.getSourceFile();
				const type = this.getTypeFromJSDoc(member, typeChecker) || member.type?.getText() || 'any';
				properties.push({
					name: member.name.getText(),
					type,
					visibility: 'public',
					isStatic: member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) || false,
					lineNumber: sourceFile?.getLineAndCharacterOfPosition(member.getStart()).line + 1,
					endLineNumber: sourceFile?.getLineAndCharacterOfPosition(member.getEnd()).line + 1,
				});
			} else if (ts.isMethodDeclaration(member) && member.name) {
				const sourceFile = member.getSourceFile();
				const isStatic = member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) || false;
				const isAsync = member.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;
				const returnType = this.getReturnTypeFromJSDoc(member, typeChecker) || member.type?.getText() || 'any';
				
				methods.push({
					name: member.name.getText(),
					parameters: member.parameters.map(p => ({
						name: p.name.getText(),
						type: this.getTypeFromJSDoc(p, typeChecker) || p.type?.getText() || 'any',
						optional: !!p.questionToken
					})),
					returnType,
					visibility: 'public',
					isStatic,
					isAsync,
					lineNumber: sourceFile?.getLineAndCharacterOfPosition(member.getStart()).line + 1,
					endLineNumber: sourceFile?.getLineAndCharacterOfPosition(member.getEnd()).line + 1,
				});
			} else if (ts.isConstructorDeclaration(member)) {
				const sourceFile = member.getSourceFile();
				// Extract this.x = ... assignments as properties
				const ctorProps = this.extractConstructorProperties(member, sourceFile, typeChecker);
				for (const prop of ctorProps) {
					if (!properties.some(p => p.name === prop.name)) {
						properties.push(prop);
					}
				}
				methods.push({
					name: 'constructor',
					parameters: member.parameters.map(p => ({
						name: p.name.getText(),
						type: this.getTypeFromJSDoc(p, typeChecker) || p.type?.getText() || 'any',
						optional: false
					})),
					returnType: 'void',
					visibility: 'public',
					lineNumber: sourceFile?.getLineAndCharacterOfPosition(member.getStart()).line + 1,
					endLineNumber: sourceFile?.getLineAndCharacterOfPosition(member.getEnd()).line + 1,
				});
			}
		}

		return {
			name, filePath, properties, methods,
			extends: extendsClass,
			classType: 'class'
		};
	}

	private extractConstructorProperties(node: ts.ConstructorDeclaration, sourceFile: ts.SourceFile, typeChecker?: ts.TypeChecker): PropertyInfo[] {
		const properties: PropertyInfo[] = [];

		const visit = (n: ts.Node) => {
			// Look for: this.x = ...
			if (ts.isExpressionStatement(n) &&
				ts.isBinaryExpression(n.expression) &&
				ts.isPropertyAccessExpression(n.expression.left) &&
				n.expression.left.expression.kind === ts.SyntaxKind.ThisKeyword) {
				const propName = n.expression.left.name.getText();
				
				// Try multiple approaches to get the type
				let type = 'any';
				
				// 1. Try JSDoc comment from the statement
				const jsDocComment = (n as any).jsDoc;
				if (jsDocComment && jsDocComment.length > 0) {
					const typeTag = jsDocComment[0].tags?.find((tag: any) => tag.kind === ts.SyntaxKind.JSDocTypeTag);
					if (typeTag && typeTag.typeExpression) {
						type = typeTag.typeExpression.type.getText();
					}
				}
				
				// 2. If typeChecker available, try to infer type from the assignment
				if (type === 'any' && typeChecker) {
					try {
						const tsType = typeChecker.getTypeAtLocation(n.expression.right);
						const typeString = typeChecker.typeToString(tsType);
						if (typeString && typeString !== 'any') {
							type = typeString;
						}
					} catch (e) {
						// Ignore type checker errors
					}
				}
				
				console.log(`    📝 JS constructor property: this.${propName} = ... -> type: ${type}`);
				
				properties.push({
					name: propName,
					type,
					visibility: 'public',
					lineNumber: sourceFile?.getLineAndCharacterOfPosition(n.getStart()).line + 1,
					endLineNumber: sourceFile?.getLineAndCharacterOfPosition(n.getEnd()).line + 1,
				});
			}
			ts.forEachChild(n, visit);
		};

		if (node.body) {
			visit(node.body);
		}

		return properties;
	}

	private extractModuleInfo(sourceFile: ts.SourceFile, filePath: string): ClassInfo | null {
		const fileName = path.basename(filePath, path.extname(filePath));
		const moduleName = `[${fileName}]`;
		const methods: MethodInfo[] = [];
		const functionNodes = new Map<string, ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression>();

		sourceFile.forEachChild(node => {
			// function declarations
			if (ts.isFunctionDeclaration(node) && node.name) {
				const funcName = node.name.getText();
				methods.push({
					name: funcName,
					parameters: node.parameters.map(p => ({
						name: p.name.getText(),
						type: 'any',
						optional: false
					})),
					returnType: 'any',
					visibility: 'public',
					isStatic: true,
					isAsync: node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false,
				});
				functionNodes.set(funcName, node);
			}

			// const foo = () => {} or const foo = function() {}
			if (ts.isVariableStatement(node)) {
				for (const decl of node.declarationList.declarations) {
					if (ts.isIdentifier(decl.name) && decl.initializer &&
						(ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
						const funcName = decl.name.getText();
						methods.push({
							name: funcName,
							parameters: decl.initializer.parameters.map(p => ({
								name: p.name.getText(),
								type: 'any',
								optional: false
							})),
							returnType: 'any',
							visibility: 'public',
							isStatic: true,
							isAsync: decl.initializer.modifiers?.some(
								m => m.kind === ts.SyntaxKind.AsyncKeyword
							) || false,
						});
						functionNodes.set(funcName, decl.initializer);
					}
				}
			}
		});

		if (methods.length === 0) { return null; }
		
		// Store function nodes for relationship extraction
		const moduleInfo: any = { 
			name: moduleName, 
			filePath, 
			properties: [], 
			methods, 
			isModule: true, 
			classType: 'module',
			_functionNodes: functionNodes // Store AST nodes for relationship extraction
		};
		return moduleInfo;
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

	/**
	 * Extract type from JSDoc @type or @param annotations
	 */
	private getTypeFromJSDoc(node: ts.Node, typeChecker?: ts.TypeChecker): string | undefined {
		// For parameters, check parent method's @param tags
		if (ts.isParameter(node) && node.parent) {
			const paramName = node.name.getText();
			const jsDocs = (node.parent as any).jsDoc;
			if (jsDocs) {
				for (const jsDoc of jsDocs) {
					if (jsDoc.tags) {
						for (const tag of jsDoc.tags) {
							if (tag.kind === ts.SyntaxKind.JSDocParameterTag) {
								const tagParamName = tag.name?.getText();
								if (tagParamName === paramName && tag.typeExpression) {
									const typeText = tag.typeExpression.type.getText();
									return typeText;
								}
							}
						}
					}
				}
			}
		}

		// For other nodes, try type checker
		if (!typeChecker) return undefined;

		const symbol = typeChecker.getSymbolAtLocation(node);
		if (!symbol) return undefined;

		// Try to get type from JSDoc tags
		const jsDocTags = symbol.getJsDocTags();
		for (const tag of jsDocTags) {
			if (tag.name === 'type') {
				return tag.text?.map((t: any) => t.text).join('') || undefined;
			}
		}

		return undefined;
	}

	/**
	 * Extract return type from JSDoc @returns annotation
	 */
	private getReturnTypeFromJSDoc(node: ts.MethodDeclaration, typeChecker?: ts.TypeChecker): string | undefined {
		if (!typeChecker) return undefined;

		const jsDocs = (node as any).jsDoc;
		if (jsDocs) {
			for (const jsDoc of jsDocs) {
				if (jsDoc.tags) {
					for (const tag of jsDoc.tags) {
						if ((tag.kind === ts.SyntaxKind.JSDocReturnTag || 
							 tag.kind === ts.SyntaxKind.JSDocReturnTag) &&
							tag.typeExpression) {
							return tag.typeExpression.type.getText();
						}
					}
				}
			}
		}

		return undefined;
	}
}
