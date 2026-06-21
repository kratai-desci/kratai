import * as fs from 'fs';
import * as path from 'path';
import { AbstractParserStrategy } from './AbstractParserStrategy';
import { ClassInfo, PropertyInfo, MethodInfo, ClassRelationship } from '../../../types/domain';

// Import php-parser
const phpParser = require('php-parser');

/**
 * PHP parser for extracting classes, interfaces, traits, and relationships
 * Supports: Classes, interfaces, traits, inheritance, type hints (PHP 7.4+, 8.0+)
 */
export class PHPParser extends AbstractParserStrategy {
	supportedExtensions = ['.php'];
	private parser: any;

	constructor() {
		super();
		this.parser = new phpParser({
			parser: {
				extractDoc: true,
				php7: true,
			},
			ast: {
				withPositions: true,
			},
		});
	}

	parseFile(filePath: string): ClassInfo[] {
		const classes: ClassInfo[] = [];

		try {
			const sourceCode = fs.readFileSync(filePath, 'utf-8');
			const ast = this.parser.parseCode(sourceCode, filePath);

			// Walk through AST to find classes, interfaces, traits
			this.walkAST(ast, (node: any) => {
				if (node.kind === 'class') {
					classes.push(this.extractClassInfo(node, filePath));
				} else if (node.kind === 'interface') {
					classes.push(this.extractInterfaceInfo(node, filePath));
				} else if (node.kind === 'trait') {
					classes.push(this.extractTraitInfo(node, filePath));
				}
			});
		} catch (error) {
			console.error(`Error parsing PHP file ${filePath}:`, error);
		}

		return classes;
	}

	private walkAST(node: any, callback: (node: any) => void): void {
		if (!node || typeof node !== 'object') {
			return;
		}

		callback(node);

		// Walk children
		for (const key in node) {
			if (key === 'loc' || key === 'kind') {
				continue;
			}

			const child = node[key];
			if (Array.isArray(child)) {
				child.forEach(c => this.walkAST(c, callback));
			} else if (typeof child === 'object') {
				this.walkAST(child, callback);
			}
		}
	}

	private extractClassInfo(node: any, filePath: string): ClassInfo {
		const className = node.name?.name || node.name || 'UnknownClass';
		const properties: PropertyInfo[] = [];
		const methods: MethodInfo[] = [];
		let extendsClass: string | undefined;
		const implementsInterfaces: string[] = [];

		// Extract extends
		if (node.extends) {
			extendsClass = this.getTypeName(node.extends);
		}

		// Extract implements
		if (node.implements && Array.isArray(node.implements)) {
			node.implements.forEach((impl: any) => {
				implementsInterfaces.push(this.getTypeName(impl));
			});
		}

		// Extract properties and methods from class body
		if (node.body && Array.isArray(node.body)) {
			for (const member of node.body) {
				if (member.kind === 'property' || member.kind === 'propertystatement') {
					properties.push(...this.extractProperties(member));
				} else if (member.kind === 'method') {
					methods.push(this.extractMethod(member));
				}
			}
		}

		return {
			name: className,
			filePath,
			properties,
			methods,
			extends: extendsClass,
			implements: implementsInterfaces.length > 0 ? implementsInterfaces : undefined,
			classType: 'class',
		};
	}

	private extractInterfaceInfo(node: any, filePath: string): ClassInfo {
		const interfaceName = node.name?.name || node.name || 'UnknownInterface';
		const methods: MethodInfo[] = [];
		const extendsInterfaces: string[] = [];

		// Interfaces can extend multiple interfaces
		if (node.extends && Array.isArray(node.extends)) {
			node.extends.forEach((ext: any) => {
				extendsInterfaces.push(this.getTypeName(ext));
			});
		}

		// Extract methods from interface body
		if (node.body && Array.isArray(node.body)) {
			for (const member of node.body) {
				if (member.kind === 'method') {
					methods.push(this.extractMethod(member));
				}
			}
		}

		return {
			name: interfaceName,
			filePath,
			properties: [],
			methods,
			extends: extendsInterfaces.length > 0 ? extendsInterfaces[0] : undefined,
			implements: extendsInterfaces.length > 1 ? extendsInterfaces.slice(1) : undefined,
			classType: 'interface',
		};
	}

	private extractTraitInfo(node: any, filePath: string): ClassInfo {
		const traitName = node.name?.name || node.name || 'UnknownTrait';
		const properties: PropertyInfo[] = [];
		const methods: MethodInfo[] = [];

		// Extract properties and methods from trait body
		if (node.body && Array.isArray(node.body)) {
			for (const member of node.body) {
				if (member.kind === 'property' || member.kind === 'propertystatement') {
					properties.push(...this.extractProperties(member));
				} else if (member.kind === 'method') {
					methods.push(this.extractMethod(member));
				}
			}
		}

		return {
			name: traitName,
			filePath,
			properties,
			methods,
			classType: 'class', // Traits are treated as classes for visualization
		};
	}

	private extractProperties(node: any): PropertyInfo[] {
		const properties: PropertyInfo[] = [];

		if (node.properties && Array.isArray(node.properties)) {
			for (const prop of node.properties) {
				const propName = prop.name?.name || prop.name || 'unknown';
				// Type can be on the property statement node or the property itself
				const type = node.type ? this.getTypeName(node.type) : 
				            (prop.type ? this.getTypeName(prop.type) : 'mixed');
				const visibility = node.visibility || 'public';

				properties.push({
					name: propName,
					type,
					visibility,
					isStatic: node.isStatic || false,
					lineNumber: node.loc?.start?.line || 0,
					endLineNumber: node.loc?.end?.line || 0,
				});
			}
		}

		return properties;
	}

	private extractMethod(node: any): MethodInfo {
		const methodName = node.name?.name || node.name || 'unknown';
		const parameters = this.extractParameters(node.arguments || []);
		const returnType = node.type ? this.getTypeName(node.type) : 'void';
		const visibility = node.visibility || 'public';

		return {
			name: methodName,
			parameters,
			returnType,
			visibility,
			isStatic: node.isStatic || false,
			isAsync: false, // PHP doesn't have native async
			lineNumber: node.loc?.start?.line || 0,
			endLineNumber: node.loc?.end?.line || 0,
		};
	}

	private extractParameters(params: any[]): Array<{ name: string; type: string; optional: boolean }> {
		return params.map(param => {
			const paramName = param.name?.name || param.name || 'unknown';
			const type = param.type ? this.getTypeName(param.type) : 'mixed';
			const optional = param.value !== null && param.value !== undefined;

			return { name: paramName, type, optional };
		});
	}

	private getTypeName(typeNode: any): string {
		if (!typeNode) {
			return 'mixed';
		}

		if (typeof typeNode === 'string') {
			return typeNode;
		}

		if (typeNode.name) {
			if (typeof typeNode.name === 'string') {
				return typeNode.name;
			}
			if (typeNode.name.name) {
				return typeNode.name.name;
			}
		}

		// Handle union types (PHP 8.0+)
		if (typeNode.kind === 'uniontype' && typeNode.types) {
			return typeNode.types.map((t: any) => this.getTypeName(t)).join('|');
		}

		// Handle nullable types
		if (typeNode.nullable) {
			return '?' + this.getTypeName(typeNode.type);
		}

		return 'mixed';
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

			// Inheritance (extends)
			if (classInfo.extends && allClassNames.has(classInfo.extends)) {
				const targets = classMap.get(classInfo.extends) || [];
				targets.forEach(target => {
					const toId = `${target.filePath}__${target.name}`;
					relationships.push({ from: fromId, to: toId, type: 'extends' });
				});
			}

			// Implementation (implements)
			if (classInfo.implements) {
				for (const interfaceName of classInfo.implements) {
					if (allClassNames.has(interfaceName)) {
						const targets = classMap.get(interfaceName) || [];
						targets.forEach(target => {
						const toId = `${target.filePath}__${target.name}`;
							relationships.push({ from: fromId, to: toId, type: 'implements' });
						});
					}
				}
			}

			// Composition/Dependency from type hints
			const dependencies = new Set<string>();

			// Check properties
			for (const prop of classInfo.properties) {
				const types = this.extractTypeNames(prop.type);
				types.forEach(type => {
					if (allClassNames.has(type) && type !== classInfo.name) {
						dependencies.add(type);
					}
				});
			}

			// Check method parameters and return types
			for (const method of classInfo.methods) {
				for (const param of method.parameters) {
					const types = this.extractTypeNames(param.type);
					types.forEach(type => {
						if (allClassNames.has(type) && type !== classInfo.name) {
							dependencies.add(type);
						}
					});
				}

				const returnTypes = this.extractTypeNames(method.returnType);
				returnTypes.forEach(type => {
					if (allClassNames.has(type) && type !== classInfo.name) {
						dependencies.add(type);
					}
				});
			}

			// Add 'uses' relationships
			dependencies.forEach(dep => {
				const targets = classMap.get(dep) || [];
				targets.forEach(target => {
					const toId = `${target.filePath}__${target.name}`;
					// Don't add 'uses' if there's already an 'extends' or 'implements' relationship
					const hasStrongerRelationship = relationships.some(
						r => r.from === fromId && r.to === toId && (r.type === 'extends' || r.type === 'implements')
					);

					if (!hasStrongerRelationship) {
						relationships.push({ from: fromId, to: toId, type: 'uses' });
					}
				});
			});
		}

		return relationships;
	}

	private extractTypeNames(typeString: string): string[] {
		if (!typeString || typeString === 'mixed' || typeString === 'void') {
			return [];
		}

		const types: string[] = [];

		// Remove nullable prefix
		typeString = typeString.replace(/^\?/, '');

		// Handle union types (PHP 8.0+)
		if (typeString.includes('|')) {
			const unionTypes = typeString.split('|').map(t => t.trim());
			unionTypes.forEach(t => {
				if (this.isCustomType(t)) {
					types.push(t);
				}
			});
			return types;
		}

		// Handle array types
		if (typeString.endsWith('[]')) {
			const baseType = typeString.slice(0, -2);
			if (this.isCustomType(baseType)) {
				types.push(baseType);
			}
			return types;
		}

		// Single type
		if (this.isCustomType(typeString)) {
			types.push(typeString);
		}

		return types;
	}

	private isCustomType(typeName: string): boolean {
		// Exclude PHP built-in types
		const builtInTypes = [
			'int', 'float', 'string', 'bool', 'array', 'object',
			'callable', 'iterable', 'void', 'mixed', 'null',
			'resource', 'never', 'static', 'self', 'parent',
		];

		return !builtInTypes.includes(typeName.toLowerCase()) && /^[A-Z]/.test(typeName);
	}
}
