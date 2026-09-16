import * as path from 'path';
import { ReactFlowEdge, ReactFlowNode } from '@kratai/analysis';

export interface KnowledgeGraphNode {
	id: string;
	name: string;
	folder: string;
	classType?: string;
	changeStatus?: string;
	inDegree: number;
	outDegree: number;
	// A likely place execution/control actually starts - HTTP routes always
	// qualify (something external calls them, not another parsed class), and
	// otherwise anything nothing else in the graph points at but that itself
	// calls out to something. Same idea across web/mobile/console entry
	// points; just different classType/in-degree signatures.
	isEntryPoint: boolean;
}

export interface KnowledgeGraphEdge {
	source: string;
	target: string;
	type: string;
}

export interface KnowledgeGraphData {
	workspaceName: string;
	nodes: KnowledgeGraphNode[];
	edges: KnowledgeGraphEdge[];
}

export function buildKnowledgeGraphData(workspaceName: string, nodes: ReactFlowNode[], edges: ReactFlowEdge[]): KnowledgeGraphData {
	const inDegree: Record<string, number> = {};
	const outDegree: Record<string, number> = {};
	for (const e of edges) {
		outDegree[e.source] = (outDegree[e.source] || 0) + 1;
		inDegree[e.target] = (inDegree[e.target] || 0) + 1;
	}

	const graphNodes: KnowledgeGraphNode[] = nodes.map(n => {
		const info = n.data.classInfo;
		const nodeInDegree = inDegree[n.id] || 0;
		const nodeOutDegree = outDegree[n.id] || 0;
		const isEntryPoint = info.classType === 'route' || (nodeInDegree === 0 && nodeOutDegree > 0);
		return {
			id: n.id,
			name: info.name,
			folder: path.dirname(info.filePath),
			classType: info.classType,
			changeStatus: info.changeStatus,
			inDegree: nodeInDegree,
			outDegree: nodeOutDegree,
			isEntryPoint
		};
	});

	const graphEdges: KnowledgeGraphEdge[] = edges.map(e => ({
		source: e.source,
		target: e.target,
		type: e.metadata?.umlType || 'dependency'
	}));

	return { workspaceName, nodes: graphNodes, edges: graphEdges };
}
