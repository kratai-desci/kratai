import * as fs from 'fs';
import * as ts from 'typescript';
import * as path from 'path';
import { DiagramData, ClassInfo, MethodInfo } from '../types/diagram';
import { GitDiffService } from './gitDiffService';

export interface MethodCall {
	fromClass: string;
	fromMethod: string;
	toClass: string;
	toMethod: string;
	toInstance?: string; // Variable/instance name (e.g., "user", "repo") or undefined for static calls
	isStatic: boolean;   // true for static calls like UserModel.create(), false for instance.method()
	depth: number;
	changeStatus?: 'added' | 'deleted' | 'modified' | 'unchanged';
}

export interface SequenceData {
	actors: Set<string>;
	calls: MethodCall[];
	maxDepth: number;
}

export class MethodTracerService {
	
	/**
	 * Trace all method calls starting from a specific method
	 */
	static async traceMethod(
		className: string,
		methodName: string,
		filePath: string,
		workspacePath: string,
		diagramData: DiagramData,
		maxDepth: number = 10
	): Promise<SequenceData> {
		console.log(`🔍 Tracing method: ${className}.${methodName}() from ${filePath}`);
		
		const actors = new Set<string>();
		const calls: MethodCall[] = [];
		const visited = new Set<string>(); // Prevent infinite recursion
		
		// Add the starting class as an actor (always as a class, not instance)
		actors.add(className);
		
		// Find the class
		const classInfo = diagramData.classes.find(c => 
			c.name === className && c.filePath === filePath
		);
		
		if (!classInfo) {
			console.warn(`❌ Class not found: ${className} at ${filePath}`);
			return { actors, calls, maxDepth: 0 };
		}
		
		// Find the method
		const method = classInfo.methods.find(m => m.name === methodName);
		if (!method) {
			console.warn(`❌ Method not found: ${methodName} in ${className}`);
			return { actors, calls, maxDepth: 0 };
		}
		
		// Get git diff information to track which lines are added/deleted
		const gitDiff = await GitDiffService.getDiff(workspacePath, 'HEAD~1');
		const normalizedFilePath = filePath.replace(/\\/g, '/');
		const fileChange = gitDiff?.fileChanges.get(normalizedFilePath);
		const addedLines = fileChange?.addedLines || new Set<number>();
		const deletedLines = fileChange?.deletedLines || new Set<number>();
		
		console.log(`📋 Git diff for ${normalizedFilePath}:`);
		console.log(`   Available files in git diff:`, gitDiff ? Array.from(gitDiff.fileChanges.keys()) : 'none');
		console.log(`   ${addedLines.size} added lines:`, Array.from(addedLines).slice(0, 10));
		console.log(`   ${deletedLines.size} deleted lines:`, Array.from(deletedLines).slice(0, 10));
		
		// Start tracing from this method
		this.traceMethodRecursive(
			classInfo,
			method,
			workspacePath,
			diagramData,
			actors,
			calls,
			visited,
			0,
			maxDepth,
			className,  // Starting actor is just the class name
			addedLines,
			deletedLines
		);
		
		console.log(`✅ Traced ${calls.length} method calls with ${actors.size} actors`);
		console.log(`📋 Actors:`, Array.from(actors));
		
		return {
			actors,
			calls,
			maxDepth: Math.max(...calls.map(c => c.depth), 0)
		};
	}
	
	/**
	 * Recursively trace method calls
	 */
	private static traceMethodRecursive(
		classInfo: ClassInfo,
		method: MethodInfo,
		workspacePath: string,
		diagramData: DiagramData,
		actors: Set<string>,
		calls: MethodCall[],
		visited: Set<string>,
		depth: number,
		maxDepth: number,
		currentActorName: string, // The actor name for this recursion level
		addedLines: Set<number>,
		deletedLines: Set<number>
	): void {
		// Check depth limit
		if (depth >= maxDepth) {
			console.log(`⚠️ Max depth ${maxDepth} reached`);
			return;
		}
		
		// Check for cycles
		const visitKey = `${classInfo.name}.${method.name}`;
		if (visited.has(visitKey)) {
			console.log(`🔄 Cycle detected: ${visitKey}`);
			return;
		}
		visited.add(visitKey);
		
		// Parse the method body to find method calls
		const fullPath = path.join(workspacePath, classInfo.filePath);
		if (!fs.existsSync(fullPath)) {
			console.warn(`❌ File not found: ${fullPath}`);
			return;
		}
		
		const sourceCode = fs.readFileSync(fullPath, 'utf-8');
		const sourceFile = ts.createSourceFile(
			fullPath,
			sourceCode,
			ts.ScriptTarget.Latest,
			true
		);
		
		// Find the method node
		const methodNode = this.findMethodNode(sourceFile, classInfo.name, method.name);
		if (!methodNode) {
			console.warn(`❌ Method AST node not found: ${method.name}`);
			
			// Check if this is an interface - try to find concrete implementation
			if (classInfo.classType === 'interface') {
				console.log(`🔍 Interface method detected, searching for concrete implementations...`);
				const implementations = this.findInterfaceImplementations(classInfo, diagramData);
				
				if (implementations.length > 0) {
					console.log(`✅ Found ${implementations.length} implementations: ${implementations.map(c => c.name).join(', ')}`);
					
					// Trace each implementation
					for (const implClass of implementations) {
						const implMethod = implClass.methods.find(m => m.name === method.name);
						if (implMethod) {
							console.log(`  → Tracing implementation in ${implClass.name}`);
							const isStatic = implMethod.isStatic || false;
							const instanceName = isStatic ? implClass.name : `:${implClass.name}`;
							actors.add(instanceName);
							
							// Add call from interface to implementation
							calls.push({
								fromClass: currentActorName,  // Use current actor name
								fromMethod: method.name,
								toClass: implClass.name,
								toMethod: implMethod.name,
								toInstance: undefined,
								isStatic: isStatic,
								depth: depth,
								changeStatus: implMethod.changeStatus || 'unchanged'
							});
							
							// Continue tracing the implementation
							this.traceMethodRecursive(
								implClass,
								implMethod,
								workspacePath,
								diagramData,
								actors,
								calls,
								visited,
								depth + 1,
								maxDepth,
								instanceName,  // Pass instance name to recursive call
								addedLines,
								deletedLines
							);
						}
					}
				}
			}
			
			return;
		}
		
		// Extract method calls
		const methodCalls = this.extractMethodCalls(methodNode);
		console.log(`  📞 Found ${methodCalls.length} calls in ${classInfo.name}.${method.name}()`);
		
		// Process each call
		for (const call of methodCalls) {
			// Try to resolve which class this method belongs to
			const targetClass = this.resolveMethodClass(
				call.methodName,
				call.objectName,
				classInfo,
				diagramData,
				call.previousCall
			);
			
			if (targetClass) {
				// Find the target method to get its changeStatus and check if it's static
				const targetMethod = targetClass.methods.find(m => m.name === call.methodName);
				const isStatic = targetMethod?.isStatic || false;
				
				// Determine the actual object name (handle chained calls)
				let actualObjectName = call.objectName;
				if (!actualObjectName && call.previousCall) {
					// For chained calls without an explicit object name, use a generated name
					actualObjectName = `${call.previousCall.methodName}Result`;
				}
				
				// Determine the instance name for actors
				let instanceName: string;
				if (isStatic) {
					// Static call - use class name
					instanceName = targetClass.name;
				} else {
					// Instance call - use variable name + class name
					if (actualObjectName && actualObjectName !== 'this') {
						instanceName = `${actualObjectName}:${targetClass.name}`;
					} else {
						instanceName = `:${targetClass.name}`; // Anonymous instance
					}
				}
				
				actors.add(instanceName);
				
				// Determine changeStatus based on the CALL SITE, not the method definition
				let callChangeStatus: 'added' | 'deleted' | 'modified' | 'unchanged' = 'unchanged';
				if (call.lineNumber) {
					console.log(`      🔎 Checking call at line ${call.lineNumber}: added=${addedLines.has(call.lineNumber)}, deleted=${deletedLines.has(call.lineNumber)}`);
					if (addedLines.has(call.lineNumber)) {
						callChangeStatus = 'added';
						console.log(`      ✅ Call at line ${call.lineNumber} is ADDED`);
					} else if (deletedLines.has(call.lineNumber)) {
						callChangeStatus = 'deleted';
						console.log(`      ❌ Call at line ${call.lineNumber} is DELETED`);
					} else {
						// Call is unchanged, but check if the method definition itself changed
						callChangeStatus = targetMethod?.changeStatus || 'unchanged';
					}
				} else {
					// No line number, fall back to method definition status
					callChangeStatus = targetMethod?.changeStatus || 'unchanged';
				}
				
				calls.push({
					fromClass: currentActorName,  // Use the current actor name (handles instances)
					fromMethod: method.name,
					toClass: targetClass.name,
					toMethod: call.methodName,
					toInstance: isStatic ? undefined : (actualObjectName || undefined),
					isStatic: isStatic,
					depth: depth,
					changeStatus: callChangeStatus
				});
				
				console.log(`    → ${currentActorName}.${method.name}() calls ${instanceName}.${call.methodName}() [${callChangeStatus}]`);
				
				// Recursively trace this method
				if (targetMethod) {
					this.traceMethodRecursive(
						targetClass,
						targetMethod,
						workspacePath,
						diagramData,
						actors,
						calls,
						visited,
						depth + 1,
						maxDepth,
						instanceName,  // Pass the instance name as the current actor
						addedLines,
						deletedLines
					);
				}
			}
		}
	}
	
	/**
	 * Find the AST node for a specific method
	 */
	private static findMethodNode(
		sourceFile: ts.SourceFile,
		className: string,
		methodName: string
	): ts.MethodDeclaration | ts.FunctionDeclaration | undefined {
		let methodNode: ts.MethodDeclaration | ts.FunctionDeclaration | undefined;
		
		const visit = (node: ts.Node) => {
			// Check for class method
			if (ts.isClassDeclaration(node) && node.name?.text === className) {
				node.members.forEach(member => {
					if (ts.isMethodDeclaration(member) && member.name) {
						const name = member.name.getText();
						if (name === methodName) {
							methodNode = member;
						}
					}
				});
			}
			
			// Check for standalone function
			if (ts.isFunctionDeclaration(node) && node.name?.text === methodName) {
				methodNode = node;
			}
			
			ts.forEachChild(node, visit);
		};
		
		visit(sourceFile);
		return methodNode;
	}
	
	/**
	 * Extract method calls from a method body
	 */
	private static extractMethodCalls(methodNode: ts.MethodDeclaration | ts.FunctionDeclaration): Array<{
		methodName: string;
		objectName: string | null;
		previousCall?: { objectName: string | null; methodName: string };
		lineNumber?: number;
	}> {
		const sourceFile = methodNode.getSourceFile();
		const calls: Array<{ 
			methodName: string; 
			objectName: string | null;
			previousCall?: { objectName: string | null; methodName: string };
			lineNumber?: number;
		}> = [];
		
		const visit = (node: ts.Node) => {
			// Look for CallExpression (method calls)
			if (ts.isCallExpression(node)) {
				let methodName: string | null = null;
				let objectName: string | null = null;
				let previousCall: { objectName: string | null; methodName: string } | undefined;
				
				// Get the line number of this call
				const lineNumber = sourceFile ? sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1 : undefined;
				
				// Check if it's a property access (obj.method())
				if (ts.isPropertyAccessExpression(node.expression)) {
					methodName = node.expression.name.text;
					
					// Try to get object name
					if (ts.isIdentifier(node.expression.expression)) {
						objectName = node.expression.expression.text;
					} else if (node.expression.expression.kind === ts.SyntaxKind.ThisKeyword) {
						objectName = 'this';
					}
					// Check for chained call (e.g., UserModel.create().toPlainObject())
					else if (ts.isCallExpression(node.expression.expression)) {
						const innerCall = node.expression.expression;
						if (ts.isPropertyAccessExpression(innerCall.expression)) {
							const innerMethodName = innerCall.expression.name.text;
							let innerObjectName: string | null = null;
							
							if (ts.isIdentifier(innerCall.expression.expression)) {
								innerObjectName = innerCall.expression.expression.text;
							}
							
							previousCall = { objectName: innerObjectName, methodName: innerMethodName };
							console.log(`      🔗 Detected chained call: ${innerObjectName}.${innerMethodName}().${methodName}()`);
						}
					}
				}
				// Check if it's a simple identifier (function())
				else if (ts.isIdentifier(node.expression)) {
					methodName = node.expression.text;
				}
				
				if (methodName) {
					calls.push({ methodName, objectName, previousCall, lineNumber });
					if (lineNumber) {
						console.log(`      📞 Found call to ${methodName}() at line ${lineNumber}`);
					}
				}
			}
			
			ts.forEachChild(node, visit);
		};
		
		if (methodNode.body) {
			visit(methodNode.body);
		}
		
		return calls;
	}
	
	/**
	 * Resolve which class a method belongs to
	 */
	private static resolveMethodClass(
		methodName: string,
		objectName: string | null,
		currentClass: ClassInfo,
		diagramData: DiagramData,
		previousCall?: { objectName: string | null; methodName: string }
	): ClassInfo | null {
		// Handle chained calls - resolve based on the return type of previous call
		if (previousCall && previousCall.objectName) {
			const previousClass = diagramData.classes.find(c => c.name === previousCall.objectName);
			if (previousClass) {
				const previousMethod = previousClass.methods.find(m => m.name === previousCall.methodName);
				if (previousMethod) {
					// The method is called on the return value of previousMethod
					// Look for the return type
					const returnType = previousMethod.returnType;
					const returnClass = diagramData.classes.find(c => 
						c.name === returnType || returnType.includes(c.name)
					);
					
					if (returnClass && returnClass.methods.some(m => m.name === methodName)) {
						console.log(`    ℹ️ Resolved chained call: ${previousCall.objectName}.${previousCall.methodName}() returns ${returnClass.name}, calling ${methodName}()`);
						return returnClass;
					}
				}
			}
		}
		
		// Check if it's a method on the same class (this.method())
		if (objectName === 'this') {
			const hasMethod = currentClass.methods.some(m => m.name === methodName);
			if (hasMethod) {
				return currentClass;
			}
		}
		
		// NEW: Check if objectName directly matches a class name (for static calls like UserModel.create())
		if (objectName) {
			const directClass = diagramData.classes.find(c => c.name === objectName);
			if (directClass && directClass.methods.some(m => m.name === methodName)) {
				console.log(`    ℹ️ Direct class match: ${objectName}.${methodName}()`);
				return directClass;
			}
		}
		
		// Check properties of current class to find the type
		if (objectName) {
			const property = currentClass.properties.find(p => p.name === objectName);
			if (property) {
				// Try to find class by type name
				let targetClass = diagramData.classes.find(c => 
					c.name === property.type || 
					property.type.includes(c.name)
				);
				
				// If we found an interface, prefer concrete implementations
				if (targetClass && targetClass.classType === 'interface') {
					const implementations = this.findInterfaceImplementations(targetClass, diagramData);
					if (implementations.length > 0) {
						// Use the first implementation found
						targetClass = implementations[0];
						console.log(`    ℹ️ Using implementation ${targetClass.name} for interface ${property.type}`);
					}
				}
				
				if (targetClass && targetClass.methods.some(m => m.name === methodName)) {
					return targetClass;
				}
			}
		}
		
		// Search all classes for this method (less accurate but better than nothing)
		// Prefer concrete classes over interfaces
		const candidates = diagramData.classes.filter(c => 
			c.methods.some(m => m.name === methodName)
		);
		
		// Sort: concrete classes first, then interfaces
		candidates.sort((a, b) => {
			if (a.classType === 'interface' && b.classType !== 'interface') return 1;
			if (a.classType !== 'interface' && b.classType === 'interface') return -1;
			return 0;
		});
		
		return candidates.length > 0 ? candidates[0] : null;
	}
	
	/**
	 * Find classes that implement a given interface
	 */
	private static findInterfaceImplementations(
		interfaceClass: ClassInfo,
		diagramData: DiagramData
	): ClassInfo[] {
		const implementations: ClassInfo[] = [];
		
		// Look for classes that implement this interface
		for (const classInfo of diagramData.classes) {
			// Skip the interface itself
			if (classInfo.name === interfaceClass.name) {
				continue;
			}
			
			// Check if this class implements the interface
			// Look for inheritance/implementation relationships
			const implementsInterface = classInfo.properties.some(prop => 
				prop.type === interfaceClass.name
			) || classInfo.name.toLowerCase().includes(interfaceClass.name.toLowerCase().replace('i', ''));
			
			// Better check: see if class has the same methods as the interface
			const interfaceMethodNames = new Set(interfaceClass.methods.map(m => m.name));
			const classMethodNames = new Set(classInfo.methods.map(m => m.name));
			
			// If class has all interface methods, it likely implements it
			let hasAllMethods = true;
			for (const methodName of interfaceMethodNames) {
				if (!classMethodNames.has(methodName)) {
					hasAllMethods = false;
					break;
				}
			}
			
			if (hasAllMethods && interfaceMethodNames.size > 0) {
				implementations.push(classInfo);
			}
		}
		
		return implementations;
	}
}
