import * as fs from 'fs';
import * as path from 'path';
import { AbstractParserStrategy } from './AbstractParserStrategy';
import { ClassInfo, ClassRelationship } from '../../../types/domain';

/**
 * HTTP Parser - Second-pass parser for HTTP patterns
 * 
 * This parser runs AFTER language parsers to detect:
 * 1. Route definitions (decorators, annotations, file-based routing)
 * 2. HTTP client calls (fetch, axios, requests, Guzzle)
 * 3. Relationships between calls and routes
 * 
 * Unlike language parsers, this is a cross-language analyzer that:
 * - Scans all files regardless of extension
 * - Requires full workspace context
 * - Creates virtual route nodes
 */
export class HTTPParser extends AbstractParserStrategy {
	// Special marker: handles ALL extensions (second-pass parser)
	supportedExtensions = ['*'];

	/**
	 * Parse a file to extract HTTP route definitions
	 * Creates virtual "route nodes" for API endpoints
	 */
	parseFile(filePath: string): ClassInfo[] {
		const routes: ClassInfo[] = [];

		try {
			const sourceCode = fs.readFileSync(filePath, 'utf-8');
			
			// Extract routes from various patterns
			routes.push(...this.extractDecoratorRoutes(sourceCode, filePath));
			routes.push(...this.extractFileBasedRoutes(filePath));
			
		} catch (error) {
			// Silently skip files that can't be read
			return [];
		}

		return routes;
	}

	/**
	 * Extract relationships:
	 * 1. HTTP calls (fetch, axios) → route nodes
	 * 2. Route nodes → handler classes
	 */
	extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];

		try {
			// Build route map for matching
			const routeMap = this.buildRouteMap(classes);

			// Extract HTTP call relationships
			for (const classInfo of classes) {
				// Skip route nodes themselves (they have virtual paths)
				if (classInfo.classType === 'route' || classInfo.filePath.startsWith('route://')) {
					continue;
				}

				try {
					// Resolve absolute path if needed
					const absolutePath = path.isAbsolute(classInfo.filePath) 
						? classInfo.filePath 
						: path.join(workspacePath, classInfo.filePath);

					// Check if file exists and is readable
					if (!fs.existsSync(absolutePath)) {
						continue;
					}

					const sourceCode = fs.readFileSync(absolutePath, 'utf-8');
					const httpCalls = this.extractHttpCalls(sourceCode, classInfo, routeMap);
					relationships.push(...httpCalls);
				} catch (error) {
					// Skip if file can't be read
					continue;
				}
			}

			// Link route nodes to handlers
			relationships.push(...this.linkRoutesToHandlers(classes));
		} catch (error) {
			console.warn('HTTPParser: Error extracting relationships:', error);
		}

		return relationships;
	}

	/**
	 * Extract decorator-based routes
	 * Examples: @Get('/users'), @app.route('/users'), @router.get
	 */
	private extractDecoratorRoutes(sourceCode: string, filePath: string): ClassInfo[] {
		const routes: ClassInfo[] = [];

		// Pattern: @Get('/path'), @Post('/path'), etc.
		const decoratorPattern = /@(Get|Post|Put|Delete|Patch|Route)\s*\(['"`]([^'"`]+)['"`]\)/gi;
		let match;

		while ((match = decoratorPattern.exec(sourceCode)) !== null) {
			const method = match[1].toUpperCase();
			const path = match[2];

			// Skip generic @Route decorators without method
			if (method === 'ROUTE') {
				continue;
			}

			routes.push({
				name: `${method} ${path}`,
				filePath: `route://${path}`,
				properties: [],
				methods: [],
				classType: 'route',
				routeMeta: {
					path,
					method,
					definedIn: filePath
				}
			});
		}

		return routes;
	}

	/**
	 * Extract file-based routes (Next.js, etc.)
	 * Examples: app/api/users/route.ts → GET /api/users
	 */
	private extractFileBasedRoutes(filePath: string): ClassInfo[] {
		const routes: ClassInfo[] = [];

		// Next.js App Router: app/api/*/route.ts
		if (filePath.includes('/app/api/') && filePath.endsWith('route.ts')) {
			const routePath = this.filePathToRoutePath(filePath);
			
			// For now, just create a generic route node
			// Actual HTTP methods will be detected when we parse the file content
			routes.push({
				name: `API ${routePath}`,
				filePath: `route://${routePath}`,
				properties: [],
				methods: [],
				classType: 'route',
				routeMeta: {
					path: routePath,
					method: '*',
					definedIn: filePath
				}
			});
		}

		return routes;
	}

	/**
	 * Convert file path to route path
	 * app/api/users/[id]/route.ts → /api/users/:id
	 */
	private filePathToRoutePath(filePath: string): string {
		let routePath = filePath
			.replace(/^.*\/app/, '')  // Remove everything before /app
			.replace(/^.*\/pages/, '')  // Or before /pages
			.replace(/\/route\.(ts|js)$/, '')
			.replace(/\/page\.(tsx|jsx)$/, '')
			.replace(/\/index\.(tsx|jsx|ts|js)$/, '')
			.replace(/\[([^\]]+)\]/g, ':$1');  // [id] → :id

		return routePath || '/';
	}

	/**
	 * Build a map of routes for quick lookup
	 */
	private buildRouteMap(classes: ClassInfo[]): Map<string, ClassInfo> {
		const routeMap = new Map<string, ClassInfo>();

		for (const classInfo of classes) {
			if (classInfo.classType === 'route' && classInfo.routeMeta) {
				const key = `${classInfo.routeMeta.method} ${classInfo.routeMeta.path}`;
				routeMap.set(key, classInfo);
			}
		}

		return routeMap;
	}

	/**
	 * Extract HTTP client calls from source code
	 */
	private extractHttpCalls(
		sourceCode: string, 
		classInfo: ClassInfo,
		routeMap: Map<string, ClassInfo>
	): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		const fromId = `${classInfo.filePath}__${classInfo.name}`;

		// Pattern 1: fetch(url, options)
		const fetchPattern = /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*\{[^}]*method:\s*['"`](\w+)['"`][^}]*\})?\s*\)/g;
		let match;

		while ((match = fetchPattern.exec(sourceCode)) !== null) {
			const url = match[1];
			const method = match[2] || 'GET';
			
			// Try to match to a known route
			const routeKey = `${method.toUpperCase()} ${url}`;
			const route = routeMap.get(routeKey);

			if (route) {
				relationships.push({
					from: fromId,
					to: `${route.filePath}__${route.name}`,
					type: 'http-call',
					metadata: { method, url }
				});
			}
		}

		// Pattern 2: axios.get(url), axios.post(url), etc.
		const axiosPattern = /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
		while ((match = axiosPattern.exec(sourceCode)) !== null) {
			const method = match[1].toUpperCase();
			const url = match[2];
			
			const routeKey = `${method} ${url}`;
			const route = routeMap.get(routeKey);

			if (route) {
				relationships.push({
					from: fromId,
					to: `${route.filePath}__${route.name}`,
					type: 'http-call',
					metadata: { method, url, library: 'axios' }
				});
			}
		}

		return relationships;
	}

	/**
	 * Link route nodes to their handler classes
	 */
	private linkRoutesToHandlers(classes: ClassInfo[]): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];

		for (const classInfo of classes) {
			if (classInfo.classType === 'route' && classInfo.routeMeta?.definedIn) {
				const routeId = `${classInfo.filePath}__${classInfo.name}`;
				
				// Find the handler class in the same file
				const handler = classes.find(c => 
					c.filePath === classInfo.routeMeta!.definedIn &&
					c.classType !== 'route'
				);

				if (handler) {
					relationships.push({
						from: routeId,
						to: `${handler.filePath}__${handler.name}`,
						type: 'routes-to'
					});
				}
			}
		}

		return relationships;
	}
}
