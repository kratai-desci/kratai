/**
 * UML Relationship Types
 * Standard UML categories for class diagram relationships
 */

export type UMLRelationshipType =
	| 'inheritance'     // Generalization: extends (solid line, hollow triangle)
	| 'realization'     // Implementation: implements (dashed line, hollow triangle)
	| 'dependency'      // Uses/calls (dashed line, open arrow)
	| 'association';    // Has-a / holds-a-reference relationship (solid line, simple arrow)
