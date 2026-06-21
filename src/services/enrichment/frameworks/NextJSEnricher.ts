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
		
		// TODO: Implement enrichment logic (TDD - tests first)
		// 1. Detect page components
		// 2. Detect server actions
		// 3. Detect middleware
		// 4. Link server actions to components
		// 5. Build middleware chain
		
		return {
			enhancedClasses,
			newRelationships,
			metadata: {
				framework: this.framework,
				features: [] // Will be populated as features are implemented
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
	// Private helper methods (stubs for TDD)
	// ========================================
	
	/**
	 * Detect page components from file-based routing
	 * 
	 * @param context - Enrichment context
	 * @returns Array of page component ClassInfo
	 */
	private detectPageComponents(context: EnrichmentContext): any[] {
		// TODO: TDD implementation
		return [];
	}
	
	/**
	 * Detect server actions ("use server" directive)
	 * 
	 * @param context - Enrichment context
	 * @returns Array of server action ClassInfo
	 */
	private detectServerActions(context: EnrichmentContext): any[] {
		// TODO: TDD implementation
		return [];
	}
	
	/**
	 * Detect middleware.ts files
	 * 
	 * @param context - Enrichment context
	 * @returns Array of middleware ClassInfo
	 */
	private detectMiddleware(context: EnrichmentContext): any[] {
		// TODO: TDD implementation
		return [];
	}
	
	/**
	 * Link server actions to components that call them
	 * 
	 * @param actions - Server actions
	 * @param context - Enrichment context
	 * @returns Array of relationships
	 */
	private linkServerActionsToComponents(actions: any[], context: EnrichmentContext): any[] {
		// TODO: TDD implementation
		return [];
	}
	
	/**
	 * Build middleware execution chain
	 * 
	 * @param middleware - Middleware components
	 * @returns Array of relationships
	 */
	private buildMiddlewareChain(middleware: any[]): any[] {
		// TODO: TDD implementation
		return [];
	}
}
