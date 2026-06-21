import { ClassInfo, ClassRelationship } from '../../types/domain';

/**
 * Context passed to enrichers containing current parsing state
 */
export interface EnrichmentContext {
	workspacePath: string;
	classes: ClassInfo[];
	relationships: ClassRelationship[];
}

/**
 * Result returned by enrichers after enhancement
 */
export interface EnrichmentResult {
	enhancedClasses: ClassInfo[];
	newRelationships: ClassRelationship[];
	metadata: {
		framework: string;
		version?: string;
		features: string[];
	};
}

/**
 * Abstract Enricher Strategy
 * 
 * Enrichers run AFTER language parsers and HTTP parser to add framework-specific knowledge:
 * - Detect framework patterns (middleware, hooks, lifecycle methods)
 * - Infer implicit relationships (route parameters, DI containers, form actions)
 * - Add semantic metadata (roles, permissions, caching strategies)
 * 
 * Examples:
 * - Next.js: Server Actions → Form components
 * - Laravel: Route model binding, middleware chains
 * - Django: View decorators, ORM relationships
 */
export abstract class AbstractEnricher {
	/**
	 * Framework name (e.g., "Next.js", "Laravel", "Django")
	 */
	abstract readonly framework: string;
	
	/**
	 * Execution priority (lower number = runs earlier)
	 * Use this when enrichers have dependencies on each other
	 */
	abstract readonly priority: number;
	
	/**
	 * Detect if this framework is present in the workspace
	 * 
	 * @param context - Current enrichment context
	 * @returns true if framework is detected
	 */
	abstract detect(context: EnrichmentContext): boolean;
	
	/**
	 * Enrich the code graph with framework-specific knowledge
	 * 
	 * @param context - Current enrichment context
	 * @returns Enhanced classes and new relationships
	 */
	abstract enrich(context: EnrichmentContext): Promise<EnrichmentResult>;
	
	/**
	 * Get framework-specific file patterns to scan
	 * Used for optimization - enricher only processes relevant files
	 * 
	 * @returns Glob patterns for framework files
	 */
	abstract getFilePatterns(): string[];
}
