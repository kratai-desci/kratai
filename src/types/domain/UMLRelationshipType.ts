/**
 * UML Relationship Types
 * Standard UML categories for class diagram relationships
 */

export type UMLRelationshipType = 
	| 'inheritance'     // Generalization: extends (solid line, hollow triangle)
	| 'realization'     // Implementation: implements (dashed line, hollow triangle)
	| 'dependency'      // Uses/calls (dashed line, open arrow)
	| 'association'     // Has-a relationship (solid line, simple arrow)
	| 'aggregation'     // Weak ownership (solid line, hollow diamond)
	| 'composition';    // Strong ownership (solid line, filled diamond)
