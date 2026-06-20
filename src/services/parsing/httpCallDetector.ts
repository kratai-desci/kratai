import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ClassInfo, ClassRelationship } from '../../types/domain';

/**
 * Detects HTTP API calls in source code and matches them to route handlers
 */
export class HttpCallDetector {
	
	/**
	 * Build a map of API routes from parsed classes
	 * Maps URL patterns to file paths
	 */
	buildRouteMap(classes: ClassInfo[]): Map<string, ClassInfo> {
		const routeMap = new Map<string, ClassInfo>();
		
		for (const classInfo of classes) {
			// Detect Next.js App Router routes: app/api/**/route.ts
			if (classInfo.filePath.includes('/api/') && 
			    (classInfo.filePath.endsWith('/route.ts') || classInfo.filePath.endsWith('/route.tsx'))) {
				
				// Convert file path to URL pattern
				// app/api/users/[id]/route.ts → /api/users/[id]
				const urlPattern = this.filePathToUrlPattern(classInfo.filePath);
				routeMap.set(urlPattern, classInfo);
				console.log(`  📍 Route: ${urlPattern} → ${classInfo.filePath}`);
			}
			
			// TODO: Add support for other frameworks:
			// - Next.js Pages Router: pages/api/**/index.ts
			// - Express: app.get('/api/users', ...)
			// - NestJS: @Get('/users')
		}
		
		console.log(`🌐 Built route map with ${routeMap.size} API routes`);
		return routeMap;
	}
	
	/**
	 * Convert Next.js file path to URL pattern
	 * src/app/api/users/[id]/route.ts → /api/users/[id]
	 * app/api/users/[id]/ban/route.ts → /api/users/[id]/ban
	 */
	private filePathToUrlPattern(filePath: string): string {
		// Find the /app/ segment
		const appIndex = filePath.indexOf('/app/');
		if (appIndex === -1) {
			console.log(`⚠️  No /app/ found in path: ${filePath}`);
			return filePath;
		}
		
		// Extract from /app/ onwards, remove /route.ts(x) suffix
		let urlPath = filePath.substring(appIndex + 4); // Skip '/app'
		urlPath = urlPath.replace(/\/route\.tsx?$/, '');
		
		return urlPath;
	}
	
	/**
	 * Detect HTTP API calls (fetch, axios, etc.) in source code
	 * @param sourceCode - The source code to analyze
	 * @param filePath - Path to the source file
	 * @returns Array of detected API calls with their target URLs
	 */
	detectHttpCalls(sourceCode: string, filePath: string): Array<{ method: string; url: string; lineNumber: number }> {
		const calls: Array<{ method: string; url: string; lineNumber: number }> = [];
		
		// Create AST
		const sourceFile = ts.createSourceFile(
			filePath,
			sourceCode,
			ts.ScriptTarget.Latest,
			true
		);
		
		const visit = (node: ts.Node) => {
			// Detect fetch() calls
			if (ts.isCallExpression(node)) {
				const expr = node.expression;
				
				// Direct fetch call: fetch('/api/users')
				if (ts.isIdentifier(expr) && expr.text === 'fetch') {
					const firstArg = node.arguments[0];
					if (firstArg && ts.isStringLiteral(firstArg)) {
						const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
						calls.push({
							method: 'GET',
							url: firstArg.text,
							lineNumber
						});
					}
				}
				
				// axios.get('/api/users')
				if (ts.isPropertyAccessExpression(expr)) {
					const object = expr.expression;
					const method = expr.name.text;
					
					if (ts.isIdentifier(object) && object.text === 'axios') {
						const httpMethod = method.toUpperCase();
						if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(httpMethod)) {
							const firstArg = node.arguments[0];
							if (firstArg && ts.isStringLiteral(firstArg)) {
								const lineNumber = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
								calls.push({
									method: httpMethod,
									url: firstArg.text,
									lineNumber
								});
							}
						}
					}
				}
			}
			
			ts.forEachChild(node, visit);
		};
		
		visit(sourceFile);
		return calls;
	}
	
	/**
	 * Create "calls" relationships between classes making HTTP requests and route handlers
	 */
	createHttpRelationships(
		classes: ClassInfo[],
		routeMap: Map<string, ClassInfo>
	): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		console.log(`🔍 Scanning ${classes.length} classes for HTTP calls...`);
		
		for (const classInfo of classes) {
			// Skip route handlers themselves
			if (classInfo.filePath.includes('/route.ts') || classInfo.filePath.includes('/route.tsx')) {
				continue;
			}
			
			try {
				// Read source file
				const sourceCode = fs.readFileSync(classInfo.filePath, 'utf-8');
				const httpCalls = this.detectHttpCalls(sourceCode, classInfo.filePath);
				
				if (httpCalls.length > 0) {
					console.log(`  🌐 ${classInfo.name} makes ${httpCalls.length} HTTP calls`);
				}
				
				// Match calls to routes
				for (const call of httpCalls) {
					const targetRoute = routeMap.get(call.url);
					if (targetRoute) {
						console.log(`    ✅ ${call.method} ${call.url} → ${targetRoute.name}`);
						relationships.push({
							from: classInfo.name,
							to: targetRoute.name,
							type: 'calls'
						});
					} else {
						console.log(`    ⚠️  ${call.method} ${call.url} → No matching route found`);
					}
				}
			} catch (error) {
				// Silently skip files that can't be read
			}
		}
		
		console.log(`🔗 Created ${relationships.length} HTTP call relationships`);
		return relationships;
	}
}
