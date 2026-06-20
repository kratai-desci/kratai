import { ClassInfo, ClassRelationship } from '../../../types/domain';

/**
 * Framework enricher interface - adds framework-specific patterns and relationships
 * 
 * Enrichers run AFTER language parsing to add framework-specific knowledge:
 * - Component patterns (React, Vue, Angular)
 * - Framework relationships (props, DI, routes)
 * - Convention-based connections (file-based routing, decorators)
 */
export interface IFrameworkEnricher {
	/** Framework name (e.g., 'react', 'nextjs', 'django') */
	readonly name: string;
	
	/** 
	 * Enrich parsed classes with framework-specific information
	 * @param classes - Already parsed classes from language parsers
	 * @param workspacePath - Root workspace path for file scanning
	 */
	enrich(classes: ClassInfo[], workspacePath: string): void;
	
	/**
	 * Extract framework-specific relationships
	 * @param classes - Enriched classes
	 * @returns Additional relationships found through framework patterns
	 */
	extractRelationships(classes: ClassInfo[]): ClassRelationship[];
}
