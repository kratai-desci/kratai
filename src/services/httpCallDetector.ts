import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ClassInfo, ClassRelationship } from '../types/diagram';

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
			}
			
			// TODO: Add support for other frameworks:
			// - Next.js Pages Router: pages/api/**/index.ts
			// - Express: app.get('/api/users', ...)
			// - NestJS: @Get('/users')
		}
		
		return routeMap;
	}
	
	/**
	 * Convert Next.js file path to URL pattern
	 * app/api/users/[id]/ban/route.ts → /api/users/[id]/ban
	 */
	private filePathToUrlPattern(filePath: string): string {
		// Remove leading 'app' and trailing '/route.ts'
		let pattern = filePath.replace(/^app\//, '/').replace(/\/route\.tsx?$/, '');
		
		// Normalize path separators
		pattern = pattern.replace(/\\/g, '/');
		
		return pattern;
	}
	
	/**
	 * Detect HTTP calls in all UI files and create relationships
	 */
	detectHttpCallRelationships(
		classes: ClassInfo[], 
		routeMap: Map<string, ClassInfo>,
		workspacePath: string
	): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		for (const classInfo of classes) {
			// Only scan UI files (pages, components, etc.)
			// Skip API route files themselves
			if (this.isUiFile(classInfo.filePath)) {
				const calledRoutes = this.detectHttpCallsInFile(
					classInfo.filePath,
					routeMap,
					workspacePath
				);
				
				// Create relationships from UI to API routes
				calledRoutes.forEach(targetClass => {
					const fromId = `${classInfo.filePath}__${classInfo.name}`;
					const toId = `${targetClass.filePath}__${targetClass.name}`;
					
					relationships.push({
						from: fromId,
						to: toId,
						type: 'calls' // New relationship type for HTTP calls
					});
				});
			}
		}
		
		return relationships;
	}
	
	/**
	 * Check if file is a UI file (not an API route)
	 */
	private isUiFile(filePath: string): boolean {
		// UI files are typically in app/ but NOT in app/api/
		// Or in components/, lib/, etc.
		return !filePath.includes('/api/') || 
		       !filePath.endsWith('/route.ts') && !filePath.endsWith('/route.tsx');
	}
	
	/**
	 * Detect HTTP calls in a single file
	 */
	private detectHttpCallsInFile(
		filePath: string,
		routeMap: Map<string, ClassInfo>,
		workspacePath: string
	): ClassInfo[] {
		const calledRoutes: ClassInfo[] = [];
		
		try {
			// Construct absolute path
			const absolutePath = path.isAbsolute(filePath) 
				? filePath 
				: path.join(workspacePath, filePath);
			
			if (!fs.existsSync(absolutePath)) {
				return calledRoutes;
			}
			
			const sourceCode = fs.readFileSync(absolutePath, 'utf-8');
			const sourceFile = ts.createSourceFile(
				absolutePath, 
				sourceCode, 
				ts.ScriptTarget.Latest, 
				true
			);
			
			const visitNode = (node: ts.Node) => {
				// Detect function calls
				if (ts.isCallExpression(node)) {
					const url = this.extractUrlFromCallExpression(node);
					if (url) {
						const matchedRoute = this.matchUrlToRoute(url, routeMap);
						if (matchedRoute && !calledRoutes.includes(matchedRoute)) {
							calledRoutes.push(matchedRoute);
						}
					}
				}
				
				ts.forEachChild(node, visitNode);
			};
			
			visitNode(sourceFile);
		} catch (error) {
			// Silently fail on parse errors
			console.log(`⚠️  Error detecting HTTP calls in ${path.basename(filePath)}:`, error);
		}
		
		return calledRoutes;
	}
	
	/**
	 * Extract URL string from various HTTP call patterns
	 */
	private extractUrlFromCallExpression(node: ts.CallExpression): string | null {
		const funcName = node.expression.getText();
		
		// Patterns to detect:
		// - fetch('/api/users')
		// - axios.get('/api/users')
		// - axios.post('/api/auth/login')
		// - useSWR('/api/users')
		// - useQuery('/api/users')
		
		const isHttpCall = 
			funcName === 'fetch' ||
			funcName.startsWith('axios.') ||
			funcName === 'useSWR' ||
			funcName === 'useQuery' ||
			funcName.includes('useMutation');
		
		if (!isHttpCall || node.arguments.length === 0) {
			return null;
		}
		
		const firstArg = node.arguments[0];
		
		// Handle string literals: fetch('/api/users')
		if (ts.isStringLiteral(firstArg)) {
			return firstArg.text;
		}
		
		// Handle template literals: fetch(`/api/users/${id}`)
		if (ts.isTemplateExpression(firstArg)) {
			return this.extractTemplatePattern(firstArg);
		}
		
		// Handle no-substitution template strings: fetch(`/api/users`)
		if (ts.isNoSubstitutionTemplateLiteral(firstArg)) {
			return firstArg.text;
		}
		
		return null;
	}
	
	/**
	 * Extract URL pattern from template literal
	 * `/api/users/${id}` → /api/users/[id]
	 */
	private extractTemplatePattern(template: ts.TemplateExpression): string {
		let pattern = template.head.text;
		
		// Convert ${param} to [param] for matching
		for (const span of template.templateSpans) {
			// Add placeholder for dynamic segment
			pattern += '[id]'; // Generic placeholder
			pattern += span.literal.text;
		}
		
		return pattern;
	}
	
	/**
	 * Match URL to a route in the route map
	 * Handles dynamic segments: /api/users/123 matches /api/users/[id]
	 */
	private matchUrlToRoute(url: string, routeMap: Map<string, ClassInfo>): ClassInfo | null {
		// Normalize URL (remove query params, trailing slash)
		url = url.split('?')[0].replace(/\/$/, '');
		
		// Only match API routes (starting with /api)
		if (!url.startsWith('/api')) {
			return null;
		}
		
		// Try exact match first
		if (routeMap.has(url)) {
			return routeMap.get(url)!;
		}
		
		// Try pattern matching for dynamic routes
		const urlSegments = url.split('/').filter(s => s);
		
		for (const [pattern, classInfo] of routeMap.entries()) {
			const patternSegments = pattern.split('/').filter(s => s);
			
			if (urlSegments.length !== patternSegments.length) {
				continue;
			}
			
			// Check if all segments match (allowing [param] to match anything)
			const matches = patternSegments.every((patternSeg, i) => {
				const urlSeg = urlSegments[i];
				// [id], [slug], etc. match any segment
				return patternSeg === urlSeg || 
				       (patternSeg.startsWith('[') && patternSeg.endsWith(']'));
			});
			
			if (matches) {
				return classInfo;
			}
		}
		
		return null;
	}
}
