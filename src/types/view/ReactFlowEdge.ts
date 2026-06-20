export interface ReactFlowEdge {
	id: string;
	source: string;
	target: string;
	type: string;
	label?: string;
	animated?: boolean;
	style?: Record<string, any>;
}
