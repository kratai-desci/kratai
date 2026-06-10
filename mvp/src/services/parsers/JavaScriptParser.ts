import * as fs from 'fs';
import * as path from 'path';
import { ClassInfo, PropertyInfo, MethodInfo, ClassRelationship } from '../../types/diagram';
import { IParserStrategy } from './IParserStrategy';

// Uses the TypeScript compiler API with allowJs — no extra deps needed
import * as ts from 'typescript';

export class JavaScriptParser implements IParserStrategy {
	supportedExtensions = ['.js', '.jsx'];

	parseFile(filePath: string): ClassInfo[] {
		const classes: ClassInfo[] = [];

		try {
			const sourceCode = fs.readFileSync(filePath, 'utf-8');

			// TypeScript compiler can parse JS with allowJs
			const sourceFile = ts.createSourceFile(
				filePath,
				sourceCode,
				ts.ScriptTarget.Latest,
				true,
				filePath.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.JS
			);

			const visit = (node: ts.Node) => {
				// ES6 class declarations
				if (ts.isClassDeclaration(node) && node.name) {
					classes.push(this.extractClassInfo(node, filePath));
				}
				// Class expressions assigned to variables: const Foo = class { ... }
				else if (ts.isVariableDeclaration(node) &&
					node.initializer && ts.isClassExpression(node.initializer) &&
					ts.isIdentifier(node.name)) {
					classes.push(this.extractClassExpressionInfo(
						node.name.getText(), node.initializer, filePath
					));
				}
				ts.forEachChild(node, visit);
			};

			visit(sourceFile);

			// If no classes found, try extracting module-level functions
			if (classes.length === 0) {
				const moduleInfo = this.extractModuleInfo(sourceFile, filePath);
				if (moduleInfo) {
					classes.push(moduleInfo);
				}
			}
		} catch {
			// Return empty on parse error — never crash
		}

		return classes;
	}

	extractRelationships(classes: ClassInfo[], allClassNames: Set<string>): ClassRelationship[] {
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

			// Dependency detection from properties and method params
			const dependencies = new Set<string>();

			for (const prop of classInfo.properties) {
				this.extractTypeNames(prop.type).forEach(t => {
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

	private extractClassInfo(node: ts.ClassDeclaration, filePath: string): ClassInfo {
		const name = node.name?.getText() || 'Anonymous';
		return this.extractClassMembers(name, node, filePath);
	}

	private extractClassExpressionInfo(
		name: string,
		node: ts.ClassExpression,
		filePath: string
	): ClassInfo {
		return this.extractClassMembers(name, node, filePath);
	}

	private extractClassMembers(
		name: string,
		node: ts.ClassDeclaration | ts.ClassExpression,
		filePath: string
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
				properties.push({
					name: member.name.getText(),
					type: member.type?.getText() || 'any',
					visibility: 'public',
					isStatic: member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) || false,
					lineNumber: sourceFile?.getLineAndCharacterOfPosition(member.getStart()).line + 1,
					endLineNumber: sourceFile?.getLineAndCharacterOfPosition(member.getEnd()).line + 1,
				});
			} else if (ts.isMethodDeclaration(member) && member.name) {
				const sourceFile = member.getSourceFile();
				const isStatic = member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) || false;
				const isAsync = member.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;
				methods.push({
					name: member.name.getText(),
					parameters: member.parameters.map(p => ({
						name: p.name.getText(),
						type: 'any',
						optional: !!p.questionToken
					})),
					returnType: 'any',
					visibility: 'public',
					isStatic,
					isAsync,
					lineNumber: sourceFile?.getLineAndCharacterOfPosition(member.getStart()).line + 1,
					endLineNumber: sourceFile?.getLineAndCharacterOfPosition(member.getEnd()).line + 1,
				});
			} else if (ts.isConstructorDeclaration(member)) {
				const sourceFile = member.getSourceFile();
				// Extract this.x = ... assignments as properties
				const ctorProps = this.extractConstructorProperties(member);
				for (const prop of ctorProps) {
					if (!properties.some(p => p.name === prop.name)) {
						properties.push(prop);
					}
				}
				methods.push({
					name: 'constructor',
					parameters: member.parameters.map(p => ({
						name: p.name.getText(),
						type: 'any',
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

	private extractConstructorProperties(node: ts.ConstructorDeclaration): PropertyInfo[] {
		const properties: PropertyInfo[] = [];

		const visit = (n: ts.Node) => {
			// Look for: this.x = ...
			if (ts.isExpressionStatement(n) &&
				ts.isBinaryExpression(n.expression) &&
				ts.isPropertyAccessExpression(n.expression.left) &&
				n.expression.left.expression.kind === ts.SyntaxKind.ThisKeyword) {
				const propName = n.expression.left.name.getText();
				properties.push({
					name: propName,
					type: 'any',
					visibility: 'public',
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

		sourceFile.forEachChild(node => {
			// function declarations
			if (ts.isFunctionDeclaration(node) && node.name) {
				methods.push({
					name: node.name.getText(),
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
			}

			// const foo = () => {} or const foo = function() {}
			if (ts.isVariableStatement(node)) {
				for (const decl of node.declarationList.declarations) {
					if (ts.isIdentifier(decl.name) && decl.initializer &&
						(ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
						methods.push({
							name: decl.name.getText(),
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
					}
				}
			}
		});

		if (methods.length === 0) { return null; }
		return { name: moduleName, filePath, properties: [], methods, isModule: true, classType: 'module' };
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
}
