import * as fs from 'fs';
import * as path from 'path';
import { IParserStrategy } from './IParserStrategy';
import { ClassInfo, PropertyInfo, MethodInfo, ClassRelationship } from '../../types/diagram';

/**
 * Python parser for extracting classes, methods, and relationships
 * Supports: Classes, inheritance, methods, properties (type hints and self.x)
 */
export class PythonParser implements IParserStrategy {
	supportedExtensions = ['.py'];

	parseFile(filePath: string): ClassInfo[] {
		const classes: ClassInfo[] = [];

		try {
			const sourceCode = fs.readFileSync(filePath, 'utf-8');
			const lines = sourceCode.split('\n');

			let currentClass: any = null;
			let currentMethod: any = null;
			let currentIndent = 0;

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const trimmed = line.trim();
				const indent = line.length - line.trimLeft().length;

				// Skip empty lines and comments
				if (!trimmed || trimmed.startsWith('#')) {
					continue;
				}

				// Class definition: class ClassName(BaseClass):
				const classMatch = trimmed.match(/^class\s+(\w+)(?:\(([^)]*)\))?:/);
				if (classMatch) {
					// Save previous class if exists (set its end line)
					if (currentClass) {
						currentClass.endLine = i; // Class ends where next class begins
						classes.push(this.finishClass(currentClass, filePath, lines.length));
					}

					const className = classMatch[1];
					const bases = classMatch[2] ? classMatch[2].split(',').map(b => b.trim()) : [];

					currentClass = {
						name: className,
						startLine: i + 1,
						endLine: undefined, // Will be set later
						properties: [],
						methods: [],
						baseClasses: bases.filter(b => b && b !== 'object'),
					};
					currentIndent = indent;
					currentMethod = null;
					continue;
				}

				if (!currentClass) {
					continue;
				}

				// Method definition: def method_name(self, ...):
			// Support complex return types like Optional[Product], List[str], etc.
			const methodMatch = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*([^:]+))?:/);
			if (methodMatch && indent > currentIndent) {
				const methodName = methodMatch[1];
				const paramsStr = methodMatch[2];
				const returnType = methodMatch[3]?.trim() || 'None';

				// Parse parameters
				const params = paramsStr
					.split(',')
					.map(p => p.trim())
					.filter(p => p && p !== 'self')
					.map(p => {
						// Handle type hints: name: type = default
						const paramMatch = p.match(/(\w+)(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?/);
						if (paramMatch) {
							return {
								name: paramMatch[1],
								type: paramMatch[2]?.trim() || 'Any',
								optional: !!paramMatch[3],
							};
						}
						return { name: p, type: 'Any', optional: false };
					});

				currentMethod = {
					name: methodName,
					parameters: params,
					returnType,
					startLine: i + 1,
				};

				currentClass.methods.push(currentMethod);
				console.log(`    📌 Found method: ${methodName}() at line ${i + 1} -> ${returnType}`);
			continue;
		}

		// Property from type annotation: name: type = value
		const propMatch = trimmed.match(/^(\w+)\s*:\s*(\w+)(?:\s*=\s*(.+))?/);
		if (propMatch && indent > currentIndent && !currentMethod) {
					const propName = propMatch[1];
					const propType = propMatch[2];

					if (!currentClass.properties.some((p: any) => p.name === propName)) {
						currentClass.properties.push({
							name: propName,
							type: propType,
							lineNumber: i + 1,
						});
					}
					continue;
				}

				// Property from assignment: self.name = value
				const selfMatch = trimmed.match(/^self\.(\w+)\s*=/);
				if (selfMatch && currentMethod) {
					const propName = selfMatch[1];

					if (!currentClass.properties.some((p: any) => p.name === propName)) {
						currentClass.properties.push({
							name: propName,
							type: 'Any',
							lineNumber: i + 1,
						});
					}
					continue;
				}

				// Track method end (when indentation decreases)
				if (currentMethod && indent <= currentIndent) {
					currentMethod.endLine = i;
					currentMethod = null;
				}
			}

			// Save last class (set its end line to end of file)
			if (currentClass) {
				currentClass.endLine = lines.length;
				classes.push(this.finishClass(currentClass, filePath, lines.length));
			}

			// If no classes found, create a module-level entry
			if (classes.length === 0) {
				const moduleName = `[${path.basename(filePath, '.py')}]`;
				const functions = this.extractModuleFunctions(lines);
				if (functions.length > 0) {
					classes.push({
						name: moduleName,
						filePath,
						properties: [],
						methods: functions,
						isModule: true,
						classType: 'module',
					});
				}
			}
		} catch (error) {
			console.error(`Error parsing Python file ${filePath}:`, error);
		}

		console.log(`✅ Python parser: ${classes.length} classes with properly detected method boundaries`);
		return classes;
	}

	private finishClass(classData: any, filePath: string, totalLines: number): ClassInfo {
		// Properly set end lines for all methods based on next method's start or class end
		if (classData.methods.length > 0) {
			// Sort methods by start line to ensure correct order
			classData.methods.sort((a: any, b: any) => a.startLine - b.startLine);
			
			for (let i = 0; i < classData.methods.length; i++) {
				const method = classData.methods[i];
				
				if (!method.endLine) {
					if (i < classData.methods.length - 1) {
						// Method ends where next method starts (minus 1)
						method.endLine = classData.methods[i + 1].startLine - 1;
					} else {
						// Last method ends where class ends
						method.endLine = classData.endLine || totalLines;
					}
				}
			}
		}

		return {
			name: classData.name,
			filePath,
			properties: classData.properties.map((p: any) => ({
				name: p.name,
				type: p.type,
				visibility: 'public',
				isStatic: false,
				lineNumber: p.lineNumber,
				endLineNumber: p.lineNumber,
			})),
			methods: classData.methods.map((m: any) => ({
				name: m.name,
				parameters: m.parameters,
				returnType: m.returnType,
				visibility: m.name.startsWith('_') ? 'private' : 'public',
				isStatic: m.name === 'staticmethod' || m.name === 'classmethod',
				isAsync: false,
				lineNumber: m.startLine,
				endLineNumber: m.endLine,
			})),
			extends: classData.baseClasses.length > 0 ? classData.baseClasses[0] : undefined,
			classType: 'class',
		};
	}

	private extractModuleFunctions(lines: string[]): MethodInfo[] {
		const functions: MethodInfo[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmed = line.trim();

			// Skip if inside a class (indented)
			if (line.length !== line.trimLeft().length) {
				continue;
			}

			// Function definition: def function_name(...):
			const funcMatch = trimmed.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*(\w+))?:/);
			if (funcMatch) {
				const funcName = funcMatch[1];
				const paramsStr = funcMatch[2];
				const returnType = funcMatch[3] || 'None';

				// Parse parameters
				const params = paramsStr
					.split(',')
					.map(p => p.trim())
					.filter(p => p)
					.map(p => {
						const paramMatch = p.match(/(\w+)(?:\s*:\s*(\w+))?/);
						return paramMatch
							? { name: paramMatch[1], type: paramMatch[2] || 'Any', optional: false }
							: { name: p, type: 'Any', optional: false };
					});

				functions.push({
					name: funcName,
					parameters: params,
					returnType,
					visibility: funcName.startsWith('_') ? 'private' : 'public',
					isStatic: false,
					isAsync: false,
					lineNumber: i + 1,
					endLineNumber: i + 1, // Will be set properly below
				});
			}
		}

		// Sort and set proper end lines for module functions
		functions.sort((a, b) => (a.lineNumber || 0) - (b.lineNumber || 0));
		for (let i = 0; i < functions.length; i++) {
			if (i < functions.length - 1) {
				functions[i].endLineNumber = (functions[i + 1].lineNumber || 0) - 1;
			} else {
				// Last function ends at file end
				functions[i].endLineNumber = lines.length;
			}
		}

		return functions;
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
						r => r.from === fromId && r.to === toId && r.type === 'extends'
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
		if (!typeString || typeString === 'Any' || typeString === 'None') {
			return [];
		}

		// Handle common Python type patterns:
		// List[MyClass], Dict[str, MyClass], Optional[MyClass], Union[MyClass, Other]
		const types: string[] = [];
		const typePattern = /\b([A-Z][a-zA-Z0-9_]*)\b/g;
		let match;

		while ((match = typePattern.exec(typeString)) !== null) {
			const typeName = match[1];
			// Exclude built-in types
			if (!['List', 'Dict', 'Set', 'Tuple', 'Optional', 'Union', 'Any', 'None'].includes(typeName)) {
				types.push(typeName);
			}
		}

		return types;
	}
}
