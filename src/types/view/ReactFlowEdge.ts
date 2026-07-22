import { UMLRelationshipType } from '../domain/UMLRelationshipType';

export interface ReactFlowEdge {
	id: string;
	source: string;
	target: string;
	type: string;
	label?: string;
	animated?: boolean;
	style?: Record<string, any>;
	metadata?: {
		umlType: UMLRelationshipType;
		detailedTypes: string[];
	};
}
