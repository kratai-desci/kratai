import * as ts from 'typescript';
import * as fs from 'fs';
const phpParser = require('php-parser');

export interface MethodCall {
	methodName: string;
	objectName: string | null;
	previousCall?: { objectName: string | null; methodName: string };
	lineNumber?: number;
}

/**
 * Extract method calls from TypeScript/JavaScript files
 */
export function extractMethodCallsTS(
	methodNode: ts.MethodDeclaration | ts.FunctionDeclaration,
	sourceFile: ts.SourceFile
): MethodCall[] {
	const calls: MethodCall[] = [];

	const visit = (node: ts.Node) => {
		// Look for CallExpression (method calls)
		if (ts.isCallExpression(node)) {
			let methodName: string | null = null;
			let objectName: string | null = null;
			let previousCall: { objectName: string | null; methodName: string } | undefined;

			// Get the line number of this call
			const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

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
				console.log(`      📞 Found call to ${methodName}() at line ${lineNumber}`);
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
 * Extract method calls from PHP files
 */
export function extractMethodCallsPHP(
	sourceCode: string,
	className: string,
	methodName: string
): MethodCall[] {
	const calls: MethodCall[] = [];

	try {
		const parser = new phpParser({
			parser: {
				extractDoc: true,
				php7: true
			},
			ast: {
				withPositions: true
			}
		});

		const ast = parser.parseCode(sourceCode);

		// Find the class and method
		const findMethodInAST = (node: any): any => {
			if (!node) return null;

			if (node.kind === 'class' && node.name?.name === className) {
				// Found the class, now find the method
				for (const member of node.body || []) {
					if (member.kind === 'method' && member.name?.name === methodName) {
						return member;
					}
				}
			}

			// Recursively search children
			for (const key of Object.keys(node)) {
				if (Array.isArray(node[key])) {
					for (const child of node[key]) {
						const result = findMethodInAST(child);
						if (result) return result;
					}
				} else if (typeof node[key] === 'object') {
					const result = findMethodInAST(node[key]);
					if (result) return result;
				}
			}

			return null;
		};

		const methodNode = findMethodInAST(ast);
		if (!methodNode) {
			console.warn(`❌ PHP method not found: ${className}.${methodName}()`);
			return calls;
		}

		// Extract method calls from the method body
		const extractCalls = (node: any) => {
			if (!node) return;

			// Look for method calls: $obj->method() or Class::method()
			if (node.kind === 'call') {
				let objName: string | null = null;
				let methName: string | null = null;
				const lineNumber = node.loc?.start?.line;

				// Instance call: $this->method() or $obj->method()
				if (node.what?.kind === 'propertylookup') {
					if (node.what.what?.kind === 'variable' && node.what.what.name) {
						objName = node.what.what.name === 'this' ? 'this' : node.what.what.name;
					}
					if (node.what.offset?.kind === 'identifier') {
						methName = node.what.offset.name;
					}
				}
				// Static call: Class::method()
				else if (node.what?.kind === 'staticlookup') {
					if (node.what.what?.kind === 'name' && node.what.what.name) {
						objName = node.what.what.name;
					}
					if (node.what.offset?.kind === 'identifier') {
						methName = node.what.offset.name;
					}
				}

				if (methName) {
					calls.push({ methodName: methName, objectName: objName, lineNumber });
					console.log(`      📞 Found PHP call to ${methName}() at line ${lineNumber}`);
				}
			}

			// Recursively search all children
			for (const key of Object.keys(node)) {
				if (Array.isArray(node[key])) {
					for (const child of node[key]) {
						extractCalls(child);
					}
				} else if (typeof node[key] === 'object') {
					extractCalls(node[key]);
				}
			}
		};

		extractCalls(methodNode.body);
	} catch (error) {
		console.error(`❌ Error parsing PHP: ${error}`);
	}

	return calls;
}

/**
 * Extract method calls from Python files using regex patterns
 */
export function extractMethodCallsPython(
	sourceCode: string,
	className: string,
	methodName: string
): MethodCall[] {
	const calls: MethodCall[] = [];

	try {
		// Find the method in the source code
		const lines = sourceCode.split('\n');
		let inMethod = false;
		let methodIndent = 0;
		let currentLineNum = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			currentLineNum = i + 1;

			// Check if we're entering the method
			const methodMatch = line.match(/^(\s*)def\s+(\w+)\s*\(/);
			if (methodMatch && methodMatch[2] === methodName) {
				inMethod = true;
				methodIndent = methodMatch[1].length;
				continue;
			}

			// Check if we've left the method (dedent or new def)
			if (inMethod) {
				const currentIndent = line.match(/^(\s*)/)?.[1].length || 0;
				if (line.trim() && currentIndent <= methodIndent && !line.trim().startsWith('#')) {
					break; // Exit method
				}

				// Look for method calls: obj.method() or self.method()
				const methodCallRegex = /(\w+)\.(\w+)\s*\(/g;
				let match;
				while ((match = methodCallRegex.exec(line)) !== null) {
					const objName = match[1];
					const methName = match[2];

					calls.push({
						methodName: methName,
						objectName: objName === 'self' ? 'this' : objName,
						lineNumber: currentLineNum
					});
					console.log(`      📞 Found Python call to ${methName}() at line ${currentLineNum}`);
				}
			}
		}
	} catch (error) {
		console.error(`❌ Error parsing Python: ${error}`);
	}

	return calls;
}

/**
 * Determine which extractor to use based on file extension
 */
export function extractMethodCallsByLanguage(
	filePath: string,
	sourceCode: string,
	className: string,
	methodName: string,
	methodNode?: ts.MethodDeclaration | ts.FunctionDeclaration,
	sourceFile?: ts.SourceFile
): MethodCall[] {
	const ext = filePath.match(/\.(ts|tsx|js|jsx|py|php)$/)?.[1];

	switch (ext) {
		case 'ts':
		case 'tsx':
		case 'js':
		case 'jsx':
			if (!methodNode || !sourceFile) {
				console.warn('❌ TypeScript/JavaScript requires methodNode and sourceFile');
				return [];
			}
			return extractMethodCallsTS(methodNode, sourceFile);

		case 'php':
			return extractMethodCallsPHP(sourceCode, className, methodName);

		case 'py':
			return extractMethodCallsPython(sourceCode, className, methodName);

		default:
			console.warn(`❌ Unsupported file extension: ${ext}`);
			return [];
	}
}
