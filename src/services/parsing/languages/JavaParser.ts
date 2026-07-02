import * as fs from 'fs';
import * as path from 'path';
import { ClassInfo, PropertyInfo, MethodInfo, ClassRelationship } from '../../../types/domain';
import { AbstractParserStrategy } from './AbstractParserStrategy';

export class JavaParser extends AbstractParserStrategy {
	supportedExtensions = ['.java'];

	parseFile(filePath: string): ClassInfo[] {
		const classes: ClassInfo[] = [];

		try {
			const sourceCode = fs.readFileSync(filePath, 'utf-8');
			
			// Remove comments to avoid false matches
			const codeWithoutComments = this.removeComments(sourceCode);
			
			// Extract package name
			const packageName = this.extractPackage(codeWithoutComments);
			
			// Find all class declarations
			const classMatches = this.extractClasses(codeWithoutComments, filePath, packageName);
			classes.push(...classMatches);
			
			// Find all interface declarations
			const interfaceMatches = this.extractInterfaces(codeWithoutComments, filePath, packageName);
			classes.push(...interfaceMatches);
			
			// Find all enum declarations
			const enumMatches = this.extractEnums(codeWithoutComments, filePath, packageName);
			classes.push(...enumMatches);
			
		} catch (error) {
			// Return empty on error — never crash the extension
		}

		return classes;
	}

	private removeComments(code: string): string {
		// Remove single-line comments
		code = code.replace(/\/\/.*/g, '');
		// Remove multi-line comments (including JavaDoc)
		code = code.replace(/\/\*[\s\S]*?\*\//g, '');
		return code;
	}

	private extractPackage(code: string): string {
		const packageMatch = code.match(/package\s+([\w.]+)\s*;/);
		return packageMatch ? packageMatch[1] : '';
	}

	private extractClasses(code: string, filePath: string, packageName: string): ClassInfo[] {
		const classes: ClassInfo[] = [];
		
		// Match class declarations: public/private/protected/abstract class ClassName extends X implements Y {
		const classRegex = /(public|private|protected)?\s*(abstract|final|static)?\s*class\s+(\w+)(?:\s+extends\s+([\w<>,\s]+))?(?:\s+implements\s+([\w,\s]+))?\s*\{/g;
		
		let match;
		while ((match = classRegex.exec(code)) !== null) {
			const visibility = match[1] || 'package-private';
			const modifier = match[2];
			const className = match[3];
			const extendsClass = match[4]?.trim();
			const implementsList = match[5]?.split(',').map(i => i.trim()).filter(Boolean);
			
			// Find the class body
			const classStartIndex = match.index + match[0].length;
			const classBody = this.extractClassBody(code, classStartIndex);
			
			const classInfo: ClassInfo = {
				name: className,
				filePath,
				properties: this.extractFields(classBody, className),
				methods: this.extractMethods(classBody, className),
				extends: extendsClass,
				implements: implementsList || [],
				isAbstract: modifier === 'abstract',
				isInterface: false,
				classType: modifier === 'abstract' ? 'abstract' : 'class'
			};
			
			classes.push(classInfo);
		}
		
		return classes;
	}

	private extractInterfaces(code: string, filePath: string, packageName: string): ClassInfo[] {
		const interfaces: ClassInfo[] = [];
		
		// Match interface declarations
		const interfaceRegex = /(public|private|protected)?\s*interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*\{/g;
		
		let match;
		while ((match = interfaceRegex.exec(code)) !== null) {
			const interfaceName = match[2];
			const extendsList = match[3]?.split(',').map(i => i.trim()).filter(Boolean);
			
			const interfaceStartIndex = match.index + match[0].length;
			const interfaceBody = this.extractClassBody(code, interfaceStartIndex);
			
			const interfaceInfo: ClassInfo = {
				name: interfaceName,
				filePath,
				properties: [],
				methods: this.extractMethods(interfaceBody, interfaceName),
				extends: extendsList && extendsList.length > 0 ? extendsList[0] : undefined,
				implements: extendsList && extendsList.length > 1 ? extendsList.slice(1) : [],
				isAbstract: false,
				isInterface: true,
				classType: 'interface'
			};
			
			interfaces.push(interfaceInfo);
		}
		
		return interfaces;
	}

	private extractEnums(code: string, filePath: string, packageName: string): ClassInfo[] {
		const enums: ClassInfo[] = [];
		
		// Match enum declarations
		const enumRegex = /(public|private|protected)?\s*enum\s+(\w+)(?:\s+implements\s+([\w,\s]+))?\s*\{/g;
		
		let match;
		while ((match = enumRegex.exec(code)) !== null) {
			const enumName = match[2];
			const implementsList = match[3]?.split(',').map(i => i.trim()).filter(Boolean);
			
			const enumStartIndex = match.index + match[0].length;
			const enumBody = this.extractClassBody(code, enumStartIndex);
			
			const enumInfo: ClassInfo = {
				name: enumName,
				filePath,
				properties: this.extractFields(enumBody, enumName),
				methods: this.extractMethods(enumBody, enumName),
				implements: implementsList || [],
				isInterface: false,
				classType: 'enum'
			};
			
			enums.push(enumInfo);
		}
		
		return enums;
	}

	private extractClassBody(code: string, startIndex: number): string {
		let braceCount = 1;
		let index = startIndex;
		
		while (index < code.length && braceCount > 0) {
			if (code[index] === '{') {
				braceCount++;
			} else if (code[index] === '}') {
				braceCount--;
			}
			index++;
		}
		
		return code.substring(startIndex, index - 1);
	}

	private extractFields(classBody: string, className: string): PropertyInfo[] {
		const fields: PropertyInfo[] = [];
		
		// Match field declarations with leading whitespace: visibility modifier type fieldName = value;
		const fieldRegex = /\s*(public|private|protected)?\s+(static|final)?\s*(static|final)?\s*([\w<>\[\],\s]+?)\s+(\w+)\s*(=\s*[^;]+)?\s*;/g;
		
		let match;
		while ((match = fieldRegex.exec(classBody)) !== null) {
			const visibility = match[1] || 'package-private';
			const modifier1 = match[2];
			const modifier2 = match[3];
			let type = match[4].trim();
			const name = match[5];
			const matchText = match[0];
			
			// Skip if this looks like a local variable inside a method
			// Check if there's a method signature before this match
			const beforeMatch = classBody.substring(0, match.index);
			const methodBeforeThis = beforeMatch.match(/\w+\s*\([^)]*\)\s*\{[^}]*$/);
			if (methodBeforeThis) {
				// This is inside a method, skip it
				continue;
			}
			
			// Skip if type contains keywords that indicate this is not a field
			if (type.match(/\b(if|for|while|return|new|throw|catch|try)\b/)) {
				continue;
			}
			
			fields.push({
				name,
				type,
				visibility: visibility as 'public' | 'private' | 'protected',
				isStatic: modifier1 === 'static' || modifier2 === 'static',
				isReadonly: modifier1 === 'final' || modifier2 === 'final',
				lineNumber: 0,
				endLineNumber: 0
			});
		}
		
		return fields;
	}

	private extractMethods(classBody: string, className: string): MethodInfo[] {
		const methods: MethodInfo[] = [];
		
		// Match method declarations
		// Supports: annotations, visibility, modifiers, generics, return type, method name, parameters
		const methodRegex = /(?:@\w+(?:\([^)]*\))?\s*)*(public|private|protected)?\s+(static|final|abstract|synchronized)?\s*(static|final|abstract|synchronized)?\s+(?:<[\w\s,]+>\s+)?([\w<>\[\],\s]+?)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w,\s]+)?\s*[{;]/g;
		
		let match;
		while ((match = methodRegex.exec(classBody)) !== null) {
			const visibility = match[1] || 'package-private';
			const modifier1 = match[2];
			const modifier2 = match[3];
			let returnType = match[4]?.trim() || 'void';
			const methodName = match[5];
			const paramsString = match[6];
			
			// Clean return type: remove visibility and modifiers if they leaked into the capture
			returnType = returnType
				.replace(/^(public|private|protected)\s+/, '')
				.replace(/^(static|final|abstract|synchronized)\s+/, '')
				.trim();
			
			// Skip constructors (same name as class)
			const isConstructor = methodName === className;
			
			// Parse parameters
			const parameters = this.parseParameters(paramsString);
			
			methods.push({
				name: methodName,
				parameters,
				returnType: isConstructor ? className : returnType,
				visibility: visibility as 'public' | 'private' | 'protected',
				isStatic: modifier1 === 'static' || modifier2 === 'static',
				isAsync: false,
				lineNumber: 0,
				endLineNumber: 0
			});
		}
		
		return methods;
	}

	private parseParameters(paramsString: string): Array<{ name: string; type: string }> {
		if (!paramsString || paramsString.trim() === '') {
			return [];
		}
		
		const params: Array<{ name: string; type: string }> = [];
		
		// Split by comma, but respect generics
		const paramParts = this.smartSplit(paramsString, ',');
		
		for (const part of paramParts) {
			const trimmed = part.trim();
			if (!trimmed) continue;
			
			// Match: @Annotation? final? Type name
			const paramMatch = trimmed.match(/(?:@\w+\s+)?(?:final\s+)?([\w<>\[\],\s]+)\s+(\w+)$/);
			if (paramMatch) {
				params.push({
					type: paramMatch[1].trim(),
					name: paramMatch[2]
				});
			}
		}
		
		return params;
	}

	private smartSplit(str: string, delimiter: string): string[] {
		const parts: string[] = [];
		let current = '';
		let depth = 0;
		
		for (let i = 0; i < str.length; i++) {
			const char = str[i];
			
			if (char === '<') {
				depth++;
			} else if (char === '>') {
				depth--;
			}
			
			if (char === delimiter && depth === 0) {
				parts.push(current);
				current = '';
			} else {
				current += char;
			}
		}
		
		if (current) {
			parts.push(current);
		}
		
		return parts;
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

			// Read source code for this class
			// Handle both absolute and workspace-relative paths
			const absolutePath = path.isAbsolute(classInfo.filePath)
				? classInfo.filePath
				: path.join(workspacePath, classInfo.filePath);
			
			let sourceCode = '';
			try {
				sourceCode = fs.readFileSync(absolutePath, 'utf-8');
			} catch (error) {
				continue;
			}
			const codeWithoutComments = this.removeComments(sourceCode);

			// 1. EXTENDS relationships
			if (classInfo.extends) {
				const parentNames = Array.isArray(classInfo.extends) ? classInfo.extends : [classInfo.extends];
				for (const parentName of parentNames) {
					const cleanParent = this.extractTypeName(parentName);
					relationships.push(
						...this.createRelationshipsToTargets(classInfo, cleanParent, classMap, 'extends')
					);
				}
			}

			// 2. IMPLEMENTS relationships
			if (classInfo.implements && classInfo.implements.length > 0) {
				for (const interfaceName of classInfo.implements) {
					const cleanInterface = this.extractTypeName(interfaceName);
					relationships.push(
						...this.createRelationshipsToTargets(classInfo, cleanInterface, classMap, 'implements')
					);
				}
			}

			// 3. COMPOSITION relationships (from field types)
			for (const property of classInfo.properties) {
				const fieldType = this.extractTypeName(property.type);
				if (allClassNames.has(fieldType)) {
					relationships.push(
						...this.createRelationshipsToTargets(classInfo, fieldType, classMap, 'composition')
					);
				}
				
				// Handle generics: List<User>, Map<String, User>
				const genericTypes = this.extractGenericTypes(property.type);
				for (const genericType of genericTypes) {
					if (allClassNames.has(genericType)) {
						relationships.push(
							...this.createRelationshipsToTargets(classInfo, genericType, classMap, 'generic')
						);
					}
				}
			}

			// 4. RETURN TYPE relationships
			for (const method of classInfo.methods) {
				const returnType = this.extractTypeName(method.returnType);
				// Skip constructors (return type = class name) and void
				if (returnType && returnType !== 'void' && returnType !== classInfo.name && allClassNames.has(returnType)) {
					relationships.push(
						...this.createRelationshipsToTargets(classInfo, returnType, classMap, 'returns')
					);
				}
				
				// Handle generic return types
				const genericTypes = this.extractGenericTypes(method.returnType);
				for (const genericType of genericTypes) {
					if (allClassNames.has(genericType)) {
						relationships.push(
							...this.createRelationshipsToTargets(classInfo, genericType, classMap, 'generic')
						);
					}
				}
			}

			// 5. PARAMETER TYPE relationships
			for (const method of classInfo.methods) {
				for (const param of method.parameters) {
					const paramType = this.extractTypeName(param.type);
					if (allClassNames.has(paramType)) {
						relationships.push(
							...this.createRelationshipsToTargets(classInfo, paramType, classMap, 'parameter')
						);
					}
					
					// Handle generic parameter types
					const genericTypes = this.extractGenericTypes(param.type);
					for (const genericType of genericTypes) {
						if (allClassNames.has(genericType)) {
							relationships.push(
								...this.createRelationshipsToTargets(classInfo, genericType, classMap, 'generic')
							);
						}
					}
				}
			}

			// 6. IMPORT relationships
			const importMatches = sourceCode.matchAll(/import\s+(?:static\s+)?([\w.]+)(?:\.\*)?\s*;/g);
			for (const match of importMatches) {
				const importPath = match[1];
				const importedClass = importPath.split('.').pop();
				if (importedClass && allClassNames.has(importedClass)) {
					relationships.push(
						...this.createRelationshipsToTargets(classInfo, importedClass, classMap, 'imports')
					);
				}
			}

			// 7. SUPER CALLS - detect super.method() and super() calls
			const superCallMatches = codeWithoutComments.matchAll(/super\s*[.(@]/g);
			if (superCallMatches && classInfo.extends) {
				for (const match of superCallMatches) {
					const parentName = this.extractTypeName(classInfo.extends);
					const existing = relationships.find(r => 
						r.from === fromId && r.to.includes(parentName) && r.type === 'calls-super'
					);
					if (!existing) {
						relationships.push(
							...this.createRelationshipsToTargets(classInfo, parentName, classMap, 'calls-super')
						);
					}
					break; // Only add one relationship per class
				}
			}
			
			// 8. STATIC METHOD CALLS: ClassName.methodName()
			const staticCallMatches = codeWithoutComments.matchAll(/\b([A-Z]\w+)\.(\w+)\s*\(/g);
			const staticTargets = new Set<string>();
			for (const match of staticCallMatches) {
				const targetClassName = match[1];
				if (allClassNames.has(targetClassName) && targetClassName !== classInfo.name) {
					staticTargets.add(targetClassName);
				}
			}
			for (const targetClassName of staticTargets) {
				relationships.push(
					...this.createRelationshipsToTargets(classInfo, targetClassName, classMap, 'calls-static')
				);
			}
			
			// 9. OBJECT INSTANTIATION: new ClassName()
			const newMatches = codeWithoutComments.matchAll(/new\s+([A-Z]\w+)(?:<[^>]+>)?\s*\(/g);
			const createdTypes = new Set<string>();
			for (const match of newMatches) {
				const targetClassName = match[1];
				if (allClassNames.has(targetClassName)) {
					createdTypes.add(targetClassName);
				}
			}
			for (const targetClassName of createdTypes) {
				relationships.push(
					...this.createRelationshipsToTargets(classInfo, targetClassName, classMap, 'creates')
				);
			}
			
			// 10. REGULAR METHOD CALLS (based on field types)
			const methodCallMatches = codeWithoutComments.matchAll(/(\w+)\.(\w+)\s*\(/g);
			const callTargets = new Set<string>();
			for (const match of methodCallMatches) {
				const possibleField = match[1];
				// Check if it's a known field
				const field = classInfo.properties.find(p => p.name === possibleField);
				if (field) {
					const fieldType = this.extractTypeName(field.type);
					if (allClassNames.has(fieldType) && !callTargets.has(fieldType)) {
						callTargets.add(fieldType);
					}
				}
			}
			for (const targetType of callTargets) {
				relationships.push(
					...this.createRelationshipsToTargets(classInfo, targetType, classMap, 'calls')
				);
			}
		}

		return relationships;
	}

	private extractTypeName(typeStr: string): string {
		if (!typeStr) return '';
		
		// Remove array brackets: User[] -> User
		typeStr = typeStr.replace(/\[\]/g, '');
		
		// Remove generics: List<User> -> List
		typeStr = typeStr.replace(/<.*>/g, '');
		
		// Get the last part after dot (for fully qualified names)
		const parts = typeStr.split('.');
		typeStr = parts[parts.length - 1];
		
		// Trim whitespace
		return typeStr.trim();
	}

	private extractGenericTypes(typeStr: string): string[] {
		const types: string[] = [];
		
		// Match content inside < >
		const genericMatch = typeStr.match(/<([^>]+)>/);
		if (genericMatch) {
			const innerTypes = genericMatch[1].split(',');
			for (const innerType of innerTypes) {
				const cleaned = this.extractTypeName(innerType);
				if (cleaned && !cleaned.match(/^(String|Integer|Long|Double|Float|Boolean|Character|Byte|Short)$/)) {
					types.push(cleaned);
				}
			}
		}
		
		return types;
	}
}
