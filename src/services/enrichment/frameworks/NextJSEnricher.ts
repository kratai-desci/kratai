import * as fs from 'fs';
import * as path from 'path';
import { AbstractEnricher, EnrichmentContext, EnrichmentResult } from '../AbstractEnricher';
import { ClassRelationship } from '../../../types/domain';

/**
 * Next.js Framework Enricher
 * 
 * Detects and enriches Next.js-specific patterns:
 * 
 * 1. File-based routing → Route components
 *    - app/page.tsx → Root page component
 *    - app/dashboard/page.tsx → Dashboard route
 *    - app/[id]/page.tsx → Dynamic route with parameter
 * 
 * 2. Server Actions → Client components
 *    - "use server" functions → Form components that call them
 *    - Relationship type: 'server-action' (to be added)
 * 
 * 3. API routes → Client calls
 *    - Already handled by HTTPParser, but can add Next.js-specific metadata
 * 
 * 4. Middleware chain
 *    - middleware.ts → Routes it protects
 *    - Relationship type: 'middleware' (to be added)
 * 
 * 5. Data fetching patterns
 *    - getServerSideProps, getStaticProps → Page components
 *    - Relationship type: 'data-fetching' (to be added)
 * 
 * 6. Layout hierarchy
 *    - app/layout.tsx → Nested layouts
 *    - Relationship type: 'layout-wraps' (to be added)
 */
export class NextJSEnricher extends AbstractEnricher {
	readonly framework = 'Next.js';
	readonly priority = 10; // Run early (lower = earlier)
	
	/**
	 * Detect if Next.js is present in the workspace
	 */
	detect(context: EnrichmentContext): boolean {
		// Method 1: Check package.json for next dependency
		const packageJsonPath = path.join(context.workspacePath, 'package.json');
		
		if (fs.existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
				if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
					return true;
				}
			} catch (error) {
				// Invalid package.json, continue checking other methods
			}
		}
		
		// Method 2: Check for app/ directory (App Router)
		if (fs.existsSync(path.join(context.workspacePath, 'app'))) {
			return true;
		}
		
		// Method 3: Check for pages/ directory (Pages Router)
		if (fs.existsSync(path.join(context.workspacePath, 'pages'))) {
			return true;
		}
		
		// Method 4: Check for next.config.js
		if (fs.existsSync(path.join(context.workspacePath, 'next.config.js')) ||
		    fs.existsSync(path.join(context.workspacePath, 'next.config.mjs'))) {
			return true;
		}
		
		return false;
	}
	
	/**
	 * Enrich the code graph with Next.js-specific knowledge
	 */
	async enrich(context: EnrichmentContext): Promise<EnrichmentResult> {
		const enhancedClasses = [...context.classes];
		const newRelationships: ClassRelationship[] = [];
		const features: string[] = [];
		
		// 1. Enrich file-based routes (detect from file paths)
		this.enrichFileBasedRoutes(enhancedClasses, context);
		features.push('file-based-routing');
		
		// 2. Identify middleware
		this.identifyMiddleware(enhancedClasses);
		features.push('middleware');
		
		// 3. Identify layouts
		this.identifyLayouts(enhancedClasses);
		features.push('layouts');
		
		// 4. Identify pages
		this.identifyPages(enhancedClasses);
		features.push('pages');
		
		// 5. Identify server actions
		this.identifyServerActions(enhancedClasses);
		features.push('server-actions');
		
		// 6. Create middleware → route relationships
		const middlewareRels = this.createMiddlewareRelationships(enhancedClasses, context);
		newRelationships.push(...middlewareRels);
		
		// 7. Create layout → page relationships
		const layoutRels = this.createLayoutRelationships(enhancedClasses, context);
		newRelationships.push(...layoutRels);
		
		// 8. Create server action relationships
		const serverActionRels = this.createServerActionRelationships(enhancedClasses, context);
		newRelationships.push(...serverActionRels);
		
		// 9. Infer route handler → service relationships (heuristic)
		const serviceRels = this.inferServiceRelationships(enhancedClasses, context);
		newRelationships.push(...serviceRels);
		
		// 10. Detect JSX component rendering (Component → Component relationships)
		// This is Next.js's version of "template detection" - components render other components
		const jsxRenderRels = this.detectJSXComponentUsage(enhancedClasses, context);
		newRelationships.push(...jsxRenderRels);
		features.push('jsx-component-rendering');
		
		// 11. Detect TypeScript type annotations (Component → DTO/Type relationships)
		// Detects: useState<UserDTO>, function(data: FormData), const x: ApiResponse
		const typeUsageRels = this.detectTypeScriptTypeUsage(enhancedClasses, context);
		newRelationships.push(...typeUsageRels);
		features.push('typescript-type-usage');
		
		// 12. Detect fetch() API calls (Component → API route relationships)
		// Detects: fetch('/api/users'), fetch('/api/auth/login', { method: 'POST' })
		const fetchCallRels = this.detectFetchAPICalls(enhancedClasses, context);
		newRelationships.push(...fetchCallRels);
		features.push('fetch-api-calls');
		
		return {
			enhancedClasses,
			newRelationships,
			metadata: {
				framework: this.framework,
				features
			}
		};
	}
	
	/**
	 * Get file patterns for Next.js files
	 */
	getFilePatterns(): string[] {
		return [
			// App Router (Next.js 13+)
			'**/app/**/page.tsx',
			'**/app/**/page.ts',
			'**/app/**/layout.tsx',
			'**/app/**/layout.ts',
			'**/app/**/route.ts',
			'**/app/**/loading.tsx',
			'**/app/**/error.tsx',
			'**/app/**/not-found.tsx',
			'**/middleware.ts',
			'**/middleware.tsx',
			
			// Pages Router (Next.js <= 12)
			'**/pages/**/*.tsx',
			'**/pages/**/*.ts',
			'**/pages/api/**/*.ts',
			'**/pages/_app.tsx',
			'**/pages/_document.tsx'
		];
	}
	
	// ========================================
	// Private helper methods
	// ========================================
	
	/**
	 * Enrich file-based routes by detecting route patterns from file paths
	 */
	private enrichFileBasedRoutes(classes: any[], context: EnrichmentContext): void {
		for (const classInfo of classes) {
			const filePath = classInfo.filePath;
			
			// Skip if not a Next.js route file
			if (!this.isNextJSRouteFile(filePath)) {
				continue;
			}
			
			const normalized = filePath.replace(/\\/g, '/');
			
			// Add route metadata if it's a route file
			if (normalized.includes('app/') && (normalized.endsWith('/route.ts') || normalized.endsWith('/route.tsx') || 
			                                     normalized.endsWith('route.ts') || normalized.endsWith('route.tsx'))) {
				classInfo.routeMeta = {
					path: this.filePathToRoutePath(filePath),
					method: '*',
					definedIn: filePath
				};
				classInfo.classType = 'route';
			}
			
			// Add route metadata for page files
			if (normalized.includes('app/') && (normalized.endsWith('/page.tsx') || normalized.endsWith('/page.ts') ||
			                                     normalized.endsWith('page.tsx') || normalized.endsWith('page.ts'))) {
				classInfo.routeMeta = {
					path: this.filePathToRoutePath(filePath),
					method: 'GET',
					definedIn: filePath
				};
				// Pages are also routes (they map to URLs)
				classInfo.classType = 'route';
			}
		}
	}
	
	/**
	 * Check if a file path is a Next.js route file
	 */
	private isNextJSRouteFile(filePath: string): boolean {
		const normalized = filePath.replace(/\\/g, '/');
		
		// App Router patterns (with or without leading slash)
		if (normalized.includes('app/')) {
			if (normalized.endsWith('/route.ts') || normalized.endsWith('/route.tsx') || 
			    normalized.endsWith('route.ts') || normalized.endsWith('route.tsx')) {
				return true;
			}
			if (normalized.endsWith('/page.tsx') || normalized.endsWith('/page.ts') ||
			    normalized.endsWith('page.tsx') || normalized.endsWith('page.ts')) {
				return true;
			}
		}
		
		// Pages Router patterns
		if (normalized.includes('pages/') && !normalized.includes('pages/api/')) {
			if (normalized.endsWith('.tsx') || normalized.endsWith('.ts')) {
				return true;
			}
		}
		
		return false;
	}
	
	/**
	 * Convert file path to route path
	 * Examples:
	 * - app/api/users/route.ts → /api/users
	 * - app/users/[id]/page.tsx → /users/:id
	 * - app/posts/[postId]/comments/[commentId]/page.tsx → /posts/:postId/comments/:commentId
	 */
	private filePathToRoutePath(filePath: string): string {
		const normalized = filePath.replace(/\\/g, '/');
		
		// Extract the route part after app/
		let routePart = '';
		const appIndex = normalized.indexOf('app/');
		
		if (appIndex !== -1) {
			routePart = normalized.substring(appIndex + 4); // +4 for 'app/'
		} else {
			return '/';
		}
		
		// Remove file extensions and special files
		routePart = routePart
			.replace(/\/route\.(ts|tsx)$/, '')
			.replace(/\/page\.(ts|tsx)$/, '')
			.replace(/\/layout\.(ts|tsx)$/, '')
			.replace(/route\.(ts|tsx)$/, '')
			.replace(/page\.(ts|tsx)$/, '')
			.replace(/layout\.(ts|tsx)$/, '')
			.replace(/\.(ts|tsx)$/, '');
		
		// Convert [param] to :param
		routePart = routePart.replace(/\[([^\]]+)\]/g, ':$1');
		
		// Ensure starts with /
		if (!routePart.startsWith('/')) {
			routePart = '/' + routePart;
		}
		
		// Handle root route
		if (routePart === '/' || routePart === '') {
			return '/';
		}
		
		// Remove trailing slashes (except for root)
		if (routePart.endsWith('/') && routePart.length > 1) {
			routePart = routePart.substring(0, routePart.length - 1);
		}
		
		return routePart;
	}
	
	/**
	 * Identify middleware files and mark them
	 */
	private identifyMiddleware(classes: any[]): void {
		for (const classInfo of classes) {
			const filePath = classInfo.filePath.replace(/\\/g, '/');
			
			// Check if it's a middleware file
			if (filePath.endsWith('middleware.ts') || filePath.endsWith('middleware.tsx')) {
				classInfo.classType = 'middleware';
			}
		}
	}
	
	/**
	 * Identify layout files and mark them
	 */
	private identifyLayouts(classes: any[]): void {
		for (const classInfo of classes) {
			const filePath = classInfo.filePath.replace(/\\/g, '/');
			
			// Check if it's a layout file
			if (filePath.includes('app/') && (filePath.endsWith('/layout.tsx') || filePath.endsWith('/layout.ts') ||
			                                   filePath.endsWith('layout.tsx') || filePath.endsWith('layout.ts'))) {
				classInfo.classType = 'layout';
			}
		}
	}
	
	/**
	 * Identify page files and mark them
	 * Note: Pages are already marked as 'route' by enrichFileBasedRoutes
	 * This is kept for future extensibility
	 */
	private identifyPages(classes: any[]): void {
		for (const classInfo of classes) {
			const filePath = classInfo.filePath.replace(/\\/g, '/');
			
			// Check if it's a page file - don't overwrite if already marked as route
			if (classInfo.classType !== 'route' && 
			    filePath.includes('app/') && 
			    (filePath.endsWith('/page.tsx') || filePath.endsWith('/page.ts') ||
			     filePath.endsWith('page.tsx') || filePath.endsWith('page.ts'))) {
				classInfo.classType = 'page';
			}
		}
	}
	
	/**
	 * Identify server action files (files with "use server")
	 */
	private identifyServerActions(classes: any[]): void {
		for (const classInfo of classes) {
			// Check if the file contains "use server" directive
			// For now, we'll check if filename suggests it's an action file
			const filePath = classInfo.filePath.replace(/\\/g, '/');
			
			if (filePath.includes('action') || filePath.includes('Action')) {
				classInfo.classType = 'server-action';
			}
		}
	}
	
	/**
	 * Create middleware → route protection relationships
	 */
	private createMiddlewareRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		// Find middleware
		const middleware = classes.filter(c => c.classType === 'middleware');
		
		// Find routes (both route and page types)
		const routes = classes.filter(c => 
			c.classType === 'route' || 
			c.classType === 'page' ||
			c.routeMeta?.path
		);
		
		// For each middleware, create relationships to routes it protects
		for (const mw of middleware) {
			for (const route of routes) {
				// Check if route should be protected by this middleware
				// For now, protect all /api/* routes
				if (route.routeMeta?.path?.startsWith('/api/')) {
					relationships.push({
						from: this.getClassId(mw),
						to: this.getClassId(route),
						type: 'middleware'
					});
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Create layout → page wrapping relationships
	 */
	private createLayoutRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		// Find layouts
		const layouts = classes.filter(c => c.classType === 'layout');
		
		// Find pages (marked as 'page' or 'route')
		const pages = classes.filter(c => 
			c.classType === 'page' || 
			(c.classType === 'route' && c.filePath.includes('page.'))
		);
		
		// For each layout, find pages in the same directory or subdirectories
		for (const layout of layouts) {
			const layoutDir = this.getDirectoryPath(layout.filePath);
			
			for (const page of pages) {
				const pageDir = this.getDirectoryPath(page.filePath);
				
				// Check if page is in same directory or subdirectory
				if (pageDir.startsWith(layoutDir)) {
					relationships.push({
						from: this.getClassId(layout),
						to: this.getClassId(page),
						type: 'layout-wraps'
					});
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Create server action relationships (form → action, button → action)
	 */
	private createServerActionRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		// Find server actions
		const serverActions = classes.filter(c => c.classType === 'server-action');
		
		// Find components that might use server actions
		const components = classes.filter(c => 
			c.classType === 'function' && 
			(c.name.includes('Form') || c.name.includes('Button'))
		);
		
		// Create relationships between components and server actions
		for (const component of components) {
			for (const action of serverActions) {
				// Simple heuristic: if component name suggests it uses actions
				if (component.name.includes('Form') || component.name.includes('Button')) {
					// Check if action name is related
					if (action.name.toLowerCase().includes('action')) {
						relationships.push({
							from: this.getClassId(component),
							to: this.getClassId(action),
							type: 'server-action'
						});
					}
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Get class ID in format: filePath__className
	 */
	private getClassId(classInfo: any): string {
		return `${classInfo.filePath}__${classInfo.name}`;
	}
	
	/**
	 * Get directory path from file path
	 */
	private getDirectoryPath(filePath: string): string {
		const normalized = filePath.replace(/\\/g, '/');
		const lastSlash = normalized.lastIndexOf('/');
		return lastSlash > 0 ? normalized.substring(0, lastSlash) : '';
	}
	
	/**
	 * Infer route handler → service relationships based on naming conventions
	 * This is a heuristic: if a route exists and a service with similar naming exists, assume they're connected
	 */
	private inferServiceRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		// Find route handlers (API routes and pages)
		const routeHandlers = classes.filter(c => 
			(c.classType === 'route' || c.classType === 'page') &&
			c.routeMeta?.path
		);
		
		// Find services
		const services = classes.filter(c => 
			c.classType === 'class' && 
			(c.name.includes('Service') || c.filePath.includes('service'))
		);
		
		// For each route handler, try to find a matching service
		for (const handler of routeHandlers) {
			const routePath = handler.routeMeta?.path || '';
			
			// Extract resource name from route path (e.g., /api/users → users)
			const pathParts = routePath.split('/').filter((p: string) => p && !p.startsWith(':'));
			const resourceName = pathParts[pathParts.length - 1];
			
			if (!resourceName) {
				continue;
			}
			
			// Find service that matches this resource
			for (const service of services) {
				const serviceName = service.name.toLowerCase();
				const resourceLower = resourceName.toLowerCase();
				
				// Match if service name includes resource name (e.g., UserService matches users)
				if (serviceName.includes(resourceLower) || 
				    serviceName.includes(resourceLower.replace(/s$/, '')) || // Remove plural
				    serviceName.includes(resourceLower + 's')) { // Add plural
					
					relationships.push({
						from: this.getClassId(handler),
						to: this.getClassId(service),
						type: 'calls',
						metadata: {
							inferred: true,
							reason: 'Next.js route handler likely calls service'
						}
					});
				}
			}
		}
		
		return relationships;
	}
	
	/**
	 * Detect JSX component usage (Component → Component relationships)
	 * 
	 * This is Next.js's version of "template detection":
	 * - Django: View → HTML template file
	 * - Next.js: Component → Component (via JSX)
	 * 
	 * Reads .tsx/.jsx files to find JSX component usage patterns like:
	 * - <UserList users={users} />
	 * - <Header />
	 * - {isVisible && <Modal />}
	 * 
	 * Only matches PascalCase components (ignores lowercase HTML tags like <div>)
	 * 
	 * TDD APPROACH (like Django enricher):
	 * 1. Read source file for each component
	 * 2. Find JSX usage: <ComponentName> or <ComponentName/>
	 * 3. Match to other components in workspace
	 * 4. Create 'renders' relationships
	 */
	private detectJSXComponentUsage(classes: any[], context: EnrichmentContext): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		// Build component name lookup (only React/Next.js components)
		const componentMap = new Map<string, any>();
		const reactComponents = classes.filter(c => 
			(c.classType === 'function' || c.classType === 'class') &&
			(c.filePath.endsWith('.tsx') || c.filePath.endsWith('.jsx'))
		);
		
		for (const component of reactComponents) {
			componentMap.set(component.name, component);
		}
		
		// For each component, scan its source for JSX usage
		for (const component of reactComponents) {
			const fullPath = path.join(context.workspacePath, component.filePath);
			
			if (!fs.existsSync(fullPath)) {
				continue;
			}
			
			try {
				const sourceCode = fs.readFileSync(fullPath, 'utf-8');
				const fromId = this.getClassId(component);
				
				// Match JSX component tags: <UserList> or <UserList/>
				// Pattern: < followed by PascalCase name (components, not HTML tags)
				// Matches: <UserList, <UserList/>, <Avatar
				// Ignores: <div, <span, <button (lowercase = HTML)
				const jsxPattern = /<([A-Z][a-zA-Z0-9]*)/g;
				let match;
				
				const foundComponents = new Set<string>(); // Avoid duplicates
				
				while ((match = jsxPattern.exec(sourceCode)) !== null) {
					const componentName = match[1]; // e.g., 'UserList'
					const targetComponent = componentMap.get(componentName);
					
					if (targetComponent && targetComponent.name !== component.name) {
						// Found a component usage!
						foundComponents.add(componentName);
					}
				}
				
				// Create relationships for all found components
				for (const compName of foundComponents) {
					const targetComponent = componentMap.get(compName);
					if (targetComponent) {
						const toId = this.getClassId(targetComponent);
						
						relationships.push({
							from: fromId,
							to: toId,
							type: 'renders',
							metadata: {
								jsxComponent: true,
								componentName: compName
							}
						});
					}
				}
			} catch (error) {
				// Ignore file read errors
			}
		}
		
		return relationships;
	}
	
	/**
	 * Detect TypeScript type annotations (Component/Page → DTO/Type relationships)
	 * 
	 * Detects type usage patterns in TypeScript/TSX files:
	 * - useState<UserDTO>
	 * - function(data: FormData)
	 * - const response: ApiResponse
	 * - as UserDTO
	 * 
	 * Creates "uses" relationships to connect components to the types they use.
	 * 
	 * TDD APPROACH (like Django/JSX detection):
	 * 1. Read source file for each component
	 * 2. Find type annotations with regex
	 * 3. Match to classes/interfaces in workspace
	 * 4. Create 'uses' relationships
	 */
	private detectTypeScriptTypeUsage(classes: any[], context: EnrichmentContext): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		// Build type name lookup (interfaces, types, classes that can be used as types)
		const typeMap = new Map<string, any>();
		const possibleTypes = classes.filter(c => 
			c.classType === 'interface' || 
			c.classType === 'class' ||
			c.classType === 'enum' ||
			(c.filePath.includes('/types/') || c.filePath.includes('/types.'))
		);
		
		for (const type of possibleTypes) {
			typeMap.set(type.name, type);
		}
		
		// For each TypeScript/TSX component, scan for type annotations
		const tsFiles = classes.filter(c => 
			c.filePath.endsWith('.ts') || c.filePath.endsWith('.tsx')
		);
		
		for (const component of tsFiles) {
			const fullPath = path.join(context.workspacePath, component.filePath);
			
			if (!fs.existsSync(fullPath)) {
				continue;
			}
			
			try {
				const sourceCode = fs.readFileSync(fullPath, 'utf-8');
				const fromId = this.getClassId(component);
				
				const foundTypes = new Set<string>(); // Avoid duplicates
				
				// Pattern 1: useState<TypeName> or useState<TypeName | null>
				const useStatePattern = /useState<([A-Z][a-zA-Z0-9]*)/g;
				let match;
				while ((match = useStatePattern.exec(sourceCode)) !== null) {
					const typeName = match[1];
					if (typeMap.has(typeName)) {
						foundTypes.add(typeName);
					}
				}
				
				// Pattern 2: Variable declarations: const x: TypeName
				const varTypePattern = /:\s*([A-Z][a-zA-Z0-9]*)/g;
				while ((match = varTypePattern.exec(sourceCode)) !== null) {
					const typeName = match[1];
					if (typeMap.has(typeName)) {
						foundTypes.add(typeName);
					}
				}
				
				// Pattern 3: Type casting: as TypeName
				const asTypePattern = /as\s+([A-Z][a-zA-Z0-9]*)/g;
				while ((match = asTypePattern.exec(sourceCode)) !== null) {
					const typeName = match[1];
					if (typeMap.has(typeName)) {
						foundTypes.add(typeName);
					}
				}
				
				// Pattern 4: Generic types: Promise<TypeName>, Array<TypeName>
				const genericPattern = /<([A-Z][a-zA-Z0-9]*)>/g;
				while ((match = genericPattern.exec(sourceCode)) !== null) {
					const typeName = match[1];
					if (typeMap.has(typeName)) {
						foundTypes.add(typeName);
					}
				}
				
				// Create relationships for all found types
				for (const typeName of foundTypes) {
					const targetType = typeMap.get(typeName);
					if (targetType) {
						const toId = this.getClassId(targetType);
						
						relationships.push({
							from: fromId,
							to: toId,
							type: 'uses',
							metadata: {
								typeAnnotation: true,
								typeName: typeName
							}
						});
					}
				}
			} catch (error) {
				// Ignore file read errors
			}
		}
		
		return relationships;
	}
	
	/**
	 * Detect fetch() API calls (Component/Page → API route relationships)
	 * 
	 * Detects fetch() patterns in TypeScript/TSX files:
	 * - fetch('/api/users')
	 * - fetch('/api/auth/login', { method: 'POST' })
	 * - fetch(`/api/users/${id}`) - template literals
	 * 
	 * Creates "http-call" relationships with HTTP method metadata.
	 * 
	 * TDD APPROACH (like Django/JSX detection):
	 * 1. Read source file for each component
	 * 2. Find fetch() calls with regex
	 * 3. Extract URL and method
	 * 4. Create 'http-call' relationships
	 */
	private detectFetchAPICalls(classes: any[], context: EnrichmentContext): ClassRelationship[] {
		const relationships: ClassRelationship[] = [];
		
		// For each TypeScript/TSX file, scan for fetch() calls
		const tsFiles = classes.filter(c => 
			c.filePath.endsWith('.ts') || c.filePath.endsWith('.tsx')
		);
		
		for (const component of tsFiles) {
			const fullPath = path.join(context.workspacePath, component.filePath);
			
			if (!fs.existsSync(fullPath)) {
				continue;
			}
			
			try {
				const sourceCode = fs.readFileSync(fullPath, 'utf-8');
				const fromId = this.getClassId(component);
				
				// Pattern: fetch('url') or fetch("url") or fetch(`url`)
				// Captures both single-line and multi-line fetch calls
				const fetchPattern = /fetch\s*\(\s*(['"`])([^'"`]+)\1\s*(?:,\s*\{([^}]*)\})?/g;
				let match;
				
				while ((match = fetchPattern.exec(sourceCode)) !== null) {
					const url = match[2]; // URL string
					const optionsBlock = match[3]; // Options object (if exists)
					
					// Extract HTTP method from options
					let method = 'GET'; // Default
					if (optionsBlock) {
						const methodMatch = /method:\s*['"](\w+)['"]/i.exec(optionsBlock);
						if (methodMatch) {
							method = methodMatch[1].toUpperCase();
						}
					}
					
					// Convert template literals ${...} to :param
					// e.g., /api/users/${id} → /api/users/:id
					// e.g., /api/users/${data.userId} → /api/users/:id
					let normalizedUrl = url.replace(/\$\{[^}]+\}/g, () => {
						// Use generic :id for all template parameters
						// This matches standard API route notation
						return ':id';
					});
					
					// Create synthetic route ID for the API endpoint
					const routeId = `route://${normalizedUrl}`;
					
					relationships.push({
						from: fromId,
						to: routeId,
						type: 'http-call',
						metadata: {
							method: method,
							url: normalizedUrl,
							originalUrl: url
						}
					});
				}
			} catch (error) {
				// Ignore file read errors
			}
		}
		
		return relationships;
	}
	
	// ========================================
	// Deprecated methods (kept for compatibility)
	// ========================================
	
	/**
	 * Detect page components from file-based routing
	 * @deprecated Use enrichFileBasedRoutes instead
	 */
	private detectPageComponents(context: EnrichmentContext): any[] {
		return [];
	}
	
	/**
	 * Detect server actions ("use server" directive)
	 * @deprecated Use identifyServerActions instead
	 */
	private detectServerActions(context: EnrichmentContext): any[] {
		return [];
	}
	
	/**
	 * Detect middleware.ts files
	 * @deprecated Use identifyMiddleware instead
	 */
	private detectMiddleware(context: EnrichmentContext): any[] {
		return [];
	}
	
	/**
	 * Link server actions to components that call them
	 * @deprecated Use createServerActionRelationships instead
	 */
	private linkServerActionsToComponents(actions: any[], context: EnrichmentContext): any[] {
		return [];
	}
	
	/**
	 * Build middleware execution chain
	 * @deprecated Use createMiddlewareRelationships instead
	 */
	private buildMiddlewareChain(middleware: any[]): any[] {
		return [];
	}
}
