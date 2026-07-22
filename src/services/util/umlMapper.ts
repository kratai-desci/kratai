import { UMLRelationshipType } from '../../types/domain/UMLRelationshipType';

/**
 * UML Relationship Mapper
 * Utility class for mapping detailed relationship types to UML standard categories
 */
export class UMLMapper {
	
	/**
	 * Maps detailed relationship types to UML standard categories
	 * 
	 * This allows parsers to emit precise, language-specific types while
	 * the diagram shows user-friendly UML standard relationships
	 * 
	 * @param detailedType - Specific relationship type from parser
	 * @returns UML category for visualization
	 */
	static mapToUMLType(detailedType: string): UMLRelationshipType {
		switch (detailedType.toLowerCase()) {
			// === INHERITANCE (Generalization) ===
			// Child extends parent class
			case 'extends':
				return 'inheritance';
			
			// === REALIZATION (Implementation) ===
			// Class implements interface/protocol
			case 'implements':
				return 'realization';
			
			// === DEPENDENCY ===
			// Transient relationships: uses, calls, passes as parameter
			// One class depends on another but doesn't own it
			case 'uses':
			case 'calls':
			case 'calls-super':
			case 'calls-static':
			case 'async-calls':
			case 'returns':           // Method returns this type
			case 'parameter':         // Method accepts this type
			case 'generic':           // Generic type parameter
			case 'imports':           // Module imports another
			case 'callback':          // Passes function as callback
			case 'http-call':         // Client calls HTTP endpoint
			case 'server-action':     // Form → Server action (Next.js)
			case 'data-fetching':     // Data fetching → Component (Next.js)
			case 'creates':           // Factory pattern (could be composition, but usually dependency)
				return 'dependency';
			
			// === ASSOCIATION ===
			// Structural relationship: one class has reference to another
			// Bidirectional or unidirectional links
			case 'routes-to':         // Route → Handler
			case 'middleware':        // Middleware → Protected route
			case 'layout-wraps':      // Layout → Nested component (Next.js)
				return 'association';
			
			// === COMPOSITION ===
			// Strong ownership: child cannot exist without parent
			// Parent controls lifecycle
			case 'composition':
			case 'injects':           // DI container → Service (Laravel/Spring)
				return 'composition';
			
			// === AGGREGATION ===
			// Weak ownership: child can exist independently
			case 're-exports':        // Module re-exports another's content
				return 'aggregation';
			
			// === DEFAULT FALLBACK ===
			// Unknown types default to dependency (safest assumption)
			default:
				console.warn(`Unknown relationship type "${detailedType}", mapping to dependency`);
				return 'dependency';
		}
	}
	
	/**
	 * Get UML relationship display label
	 * 
	 * @param umlType - UML relationship type
	 * @returns User-friendly label for diagram
	 */
	static getUMLLabel(umlType: UMLRelationshipType): string {
		switch (umlType) {
			case 'inheritance': return 'extends';
			case 'realization': return 'implements';
			case 'dependency': return 'uses';
			case 'association': return 'has';
			case 'aggregation': return 'owns';
			case 'composition': return 'contains';
		}
	}
}
