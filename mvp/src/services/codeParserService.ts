import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ClassInfo, PropertyInfo, MethodInfo, DiagramData, ClassRelationship } from '../types/diagram';
import { KrataiConfig } from '../types/config';
import { ConfigService } from './configService';

export class CodeParserService {
	
	static async parseWorkspace(workspacePath: string, config?: KrataiConfig): Promise<DiagramData> {
		const classes: ClassInfo[] = [];
		const relationships: ClassRelationship[] = [];

		// Load config if not provided
		if (!config) {
			config = await ConfigService.loadConfig(workspacePath);
		}

		// Find all files based on configuration
		const files = this.findFilesWithConfig(workspacePath, config);

		if (files.length === 0) {
			throw new Error('No files found to parse. Check your configuration.');
		}

		for (const file of files) {
			const fileClasses = this.parseFile(file);
			classes.push(...fileClasses);
		}

		// Extract relationships
		const classNames = new Set(classes.map(c => c.name));
		
		for (const classInfo of classes) {
			if (classInfo.extends) {
				relationships.push({
					from: classInfo.name,
					to: classInfo.extends,
					type: 'extends'
				});
			}

			if (classInfo.implements) {
				for (const interfaceName of classInfo.implements) {
					relationships.push({
						from: classInfo.name,
						to: interfaceName,
						type: 'implements'
					});
				}
			}

			// Extract dependencies from properties
			const dependencies = new Set<string>();
			
			for (const prop of classInfo.properties) {
				const types = this.extractTypeNames(prop.type);
				types.forEach(type => {
					if (classNames.has(type) && type !== classInfo.name) {
						dependencies.add(type);
					}
				});
			}

			// Extract dependencies from method parameters and return types
			for (const method of classInfo.methods) {
				for (const param of method.parameters) {
					const types = this.extractTypeNames(param.type);
					types.forEach(type => {
						if (classNames.has(type) && type !== classInfo.name) {
							dependencies.add(type);
						}
					});
				}
				
				const returnTypes = this.extractTypeNames(method.returnType);
				returnTypes.forEach(type => {
					if (classNames.has(type) && type !== classInfo.name) {
						dependencies.add(type);
					}
				});
			}

			// Add 'uses' relationships for dependencies
			dependencies.forEach(dep => {
				// Don't add 'uses' if there's already an 'extends' or 'implements' relationship
				const hasStrongerRelationship = relationships.some(
					r => r.from === classInfo.name && r.to === dep && (r.type === 'extends' || r.type === 'implements')
				);
				
				if (!hasStrongerRelationship) {
					relationships.push({
						from: classInfo.name,
						to: dep,
						type: 'uses'
					});
				}
			});
		}

		return { classes, relationships };
	}

	private static findFilesWithConfig(workspacePath: string, config: KrataiConfig): string[] {
		const files: string[] = [];
		
		// If no folders selected, start from workspace root
		const foldersToScan = config.selectedFolders.length > 0 
			? config.selectedFolders 
			: ['']; // Empty string means scan from root

		for (const folder of foldersToScan) {
			const fullPath = path.join(workspacePath, folder);
			if (fs.existsSync(fullPath)) {
				this.scanDirectory(fullPath, workspacePath, config, files);
			}
		}

		return files;
	}

	private static scanDirectory(
		dir: string,
		workspacePath: string,
		config: KrataiConfig,
		files: string[]
	): void {
		const items = fs.readdirSync(dir);
		
		for (const item of items) {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);
			const relativePath = path.relative(workspacePath, fullPath);

			if (stat.isDirectory()) {
				if (ConfigService.shouldIncludeFolder(relativePath, config)) {
					this.scanDirectory(fullPath, workspacePath, config, files);
				}
			} else {
				if (ConfigService.shouldIncludeFile(fullPath, config)) {
					files.push(fullPath);
				}
			}
		}
	}

	private static findTypeScriptFiles(dir: string): string[] {
		const files: string[] = [];
		
		const items = fs.readdirSync(dir);
		for (const item of items) {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				// Skip node_modules, test folders
				if (item !== 'node_modules' && item !== 'test' && !item.startsWith('.')) {
					files.push(...this.findTypeScriptFiles(fullPath));
				}
			} else if ((item.endsWith('.ts') || item.endsWith('.tsx')) && !item.endsWith('.d.ts')) {
				files.push(fullPath);
			}
		}

		return files;
	}

	private static parseFile(filePath: string): ClassInfo[] {
		const classes: ClassInfo[] = [];
		const sourceCode = fs.readFileSync(filePath, 'utf-8');
		const sourceFile = ts.createSourceFile(
			filePath,
			sourceCode,
			ts.ScriptTarget.Latest,
			true
		);

		const visit = (node: ts.Node) => {
			if (ts.isClassDeclaration(node) && node.name) {
				const classInfo = this.extractClassInfo(node, filePath);
				classes.push(classInfo);
			} else if (ts.isInterfaceDeclaration(node)) {
				const interfaceInfo = this.extractInterfaceInfo(node, filePath);
				classes.push(interfaceInfo);
			}

			ts.forEachChild(node, visit);
		};

		visit(sourceFile);
		
		// If no classes/interfaces found, create a module entry for the file
		if (classes.length === 0) {
			const moduleInfo = this.extractModuleInfo(sourceFile, filePath);
			if (moduleInfo) {
				classes.push(moduleInfo);
			}
		}
		
		return classes;
	}

	private static extractTypeNames(typeString: string): string[] {
		// Extract class names from type strings
		// Handle cases like: "MyClass", "MyClass[]", "MyClass | null", "Array<MyClass>", etc.
		const types: string[] = [];
		
		// Remove common non-class type keywords
		const nonClassTypes = new Set(['string', 'number', 'boolean', 'void', 'any', 'unknown', 'never', 'null', 'undefined', 'Promise', 'Array', 'Map', 'Set']);
		
		// Extract identifiers (words that start with uppercase letter)
		const identifierRegex = /\b([A-Z][a-zA-Z0-9]*)\b/g;
		let match;
		
		while ((match = identifierRegex.exec(typeString)) !== null) {
			const typeName = match[1];
			if (!nonClassTypes.has(typeName)) {
				types.push(typeName);
			}
		}
		
		return types;
	}

	private static extractClassInfo(node: ts.ClassDeclaration, filePath: string): ClassInfo {
		const name = node.name?.getText() || 'Anonymous';
		const properties: PropertyInfo[] = [];
		const methods: MethodInfo[] = [];
		let extendsClass: string | undefined;
		const implementsInterfaces: string[] = [];

		// Check for extends
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

		// Extract members
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
			name,
			filePath,
			properties,
			methods,
			extends: extendsClass,
			implements: implementsInterfaces.length > 0 ? implementsInterfaces : undefined,
			isAbstract,
			classType: isAbstract ? 'abstract' : 'class'
		};
	}

	private static extractInterfaceInfo(node: ts.InterfaceDeclaration, filePath: string): ClassInfo {
		const name = node.name.getText();
		const properties: PropertyInfo[] = [];
		const methods: MethodInfo[] = [];
		const implementsInterfaces: string[] = [];

		// Check for extends
		if (node.heritageClauses) {
			for (const clause of node.heritageClauses) {
				for (const type of clause.types) {
					implementsInterfaces.push(type.expression.getText());
				}
			}
		}

		// Extract members
		for (const member of node.members) {
			if (ts.isPropertySignature(member)) {
				const prop = this.extractPropertySignature(member);
				properties.push(prop);
			} else if (ts.isMethodSignature(member)) {
				const method = this.extractMethodSignature(member);
				methods.push(method);
			}
		}

		return {
			name,
			filePath,
			properties,
			methods,
			implements: implementsInterfaces.length > 0 ? implementsInterfaces : undefined,
			isInterface: true,
			classType: 'interface'
		};
	}

	private static extractProperty(node: ts.PropertyDeclaration): PropertyInfo {
		const name = node.name.getText();
		const type = node.type?.getText() || 'any';
		const visibility = this.getVisibility(node);
		const isStatic = node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) || false;
		const isReadonly = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword) || false;
		
		// Get line number for git diff
		const sourceFile = node.getSourceFile();
		const lineNumber = sourceFile ? sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 : undefined;

		return { name, type, visibility, isStatic, isReadonly, lineNumber };
	}

	private static extractPropertySignature(node: ts.PropertySignature): PropertyInfo {
		const name = node.name.getText();
		const type = node.type?.getText() || 'any';
		
		// Get line number for git diff
		const sourceFile = node.getSourceFile();
		const lineNumber = sourceFile ? sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 : undefined;

		return { name, type, visibility: 'public', lineNumber };
	}

	private static extractMethod(node: ts.MethodDeclaration): MethodInfo {
		const name = node.name.getText();
		const parameters = node.parameters.map(p => ({
			name: p.name.getText(),
			type: p.type?.getText() || 'any',
			optional: !!p.questionToken
		}));
		const returnType = node.type?.getText() || 'void';
		const visibility = this.getVisibility(node);
		const isStatic = node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) || false;
		const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;
		
		// Get line number for git diff
		const sourceFile = node.getSourceFile();
		const lineNumber = sourceFile ? sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 : undefined;

		return { name, parameters, returnType, visibility, isStatic, isAsync, lineNumber };
	}

	private static extractMethodSignature(node: ts.MethodSignature): MethodInfo {
		const name = node.name.getText();
		const parameters = node.parameters.map(p => ({
			name: p.name.getText(),
			type: p.type?.getText() || 'any',
			optional: !!p.questionToken
		}));
		const returnType = node.type?.getText() || 'void';
		
		// Get line number for git diff
		const sourceFile = node.getSourceFile();
		const lineNumber = sourceFile ? sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 : undefined;

		return { name, parameters, returnType, visibility: 'public', lineNumber };
	}

	private static extractConstructor(node: ts.ConstructorDeclaration): MethodInfo {
		const parameters = node.parameters.map(p => ({
			name: p.name.getText(),
			type: p.type?.getText() || 'any',
			optional: !!p.questionToken
		}));
		
		// Get line number for git diff
		const sourceFile = node.getSourceFile();
		const lineNumber = sourceFile ? sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 : undefined;

		return {
			name: 'constructor',
			parameters,
			returnType: 'void',
			visibility: 'public',
			lineNumber
		};
	}

	private static extractModuleInfo(sourceFile: ts.SourceFile, filePath: string): ClassInfo | null {
		const fileName = path.basename(filePath, path.extname(filePath));
		const moduleName = `[${fileName}]`; // Brackets indicate it's a module, not a class
		
		const properties: PropertyInfo[] = [];
		const methods: MethodInfo[] = [];
		
		// Visit all top-level nodes
		sourceFile.forEachChild(node => {
			// Exported function declarations
			if (ts.isFunctionDeclaration(node) && node.name) {
				const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword || m.kind === ts.SyntaxKind.DefaultKeyword);
				if (isExported) {
					const parameters = node.parameters.map(p => ({
						name: p.name.getText(),
						type: p.type?.getText() || 'any',
						optional: !!p.questionToken
					}));
					const returnType = node.type?.getText() || 'void';
					
					methods.push({
						name: node.name.getText(),
						parameters,
						returnType,
						visibility: 'public',
						isStatic: true
					});
				}
			}
			
			// Exported variables/constants (including React components)
			if (ts.isVariableStatement(node)) {
				const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
				
				for (const declaration of node.declarationList.declarations) {
					if (ts.isIdentifier(declaration.name)) {
						const name = declaration.name.getText();
						const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
						
						// Check if it's a function (React component or arrow function)
						if (declaration.initializer && 
							(ts.isArrowFunction(declaration.initializer) || 
							 ts.isFunctionExpression(declaration.initializer))) {
							
							if (isExported) {
								const funcNode = declaration.initializer;
								const parameters = funcNode.parameters.map(p => ({
									name: p.name.getText(),
									type: p.type?.getText() || 'any',
									optional: !!p.questionToken
								}));
								const returnType = funcNode.type?.getText() || (name.match(/^[A-Z]/) ? 'JSX.Element' : 'any');
								
								methods.push({
									name,
									parameters,
									returnType,
									visibility: 'public',
									isStatic: true
								});
							}
						} else if (isExported) {
							// Regular exported variable/constant
							const type = declaration.type?.getText() || (declaration.initializer ? 'inferred' : 'any');
							
							properties.push({
								name,
								type,
								visibility: 'public',
								isStatic: true,
								isReadonly: isConst
							});
						}
					}
				}
			}
			
			// Named exports
			if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
				// Just note that there are exports (actual values would need deeper analysis)
			}
		});
		
		// Only create module if there are exported items
		if (properties.length === 0 && methods.length === 0) {
			return null;
		}
		
		return {
			name: moduleName,
			filePath,
			properties,
			methods,
			isInterface: false,
			isModule: true,
			classType: 'module'
		};
	}

	private static getVisibility(node: ts.PropertyDeclaration | ts.MethodDeclaration): 'public' | 'private' | 'protected' {
		if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword)) {
			return 'private';
		}
		if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ProtectedKeyword)) {
			return 'protected';
		}
		return 'public';
	}
}
