import { DiagramData, ClassInfo } from '../../types/domain';
import { ReactFlowNode, ReactFlowEdge } from '../../types/view';

export class DiagramGeneratorService {
	
	static generateReactFlowData(diagramData: DiagramData): { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] } {
		const nodes = this.generateNodes(diagramData.classes);
		const edges = this.generateEdges(diagramData);
		
		return { nodes, edges };
	}

	private static generateNodes(classes: ClassInfo[]): ReactFlowNode[] {
		const nodes: ReactFlowNode[] = [];
		
		// Simple grid layout - can be improved with auto-layout later
		const nodesPerRow = Math.ceil(Math.sqrt(classes.length));
		const horizontalSpacing = 350;
		const verticalSpacing = 250;

		classes.forEach((classInfo, index) => {
			const row = Math.floor(index / nodesPerRow);
			const col = index % nodesPerRow;

			// Use unique ID: filePath:className to handle same class names across languages
			// Replace : with __ for React Flow compatibility
			const uniqueId = `${classInfo.filePath}__${classInfo.name}`;

			nodes.push({
				id: uniqueId,
				type: 'customClass',
				position: {
					x: col * horizontalSpacing,
					y: row * verticalSpacing
				},
				data: {
					label: classInfo.name,
					classInfo
				}
			});
		});

		return nodes;
	}

	private static generateEdges(diagramData: DiagramData): ReactFlowEdge[] {
		const edges: ReactFlowEdge[] = [];

		diagramData.relationships.forEach((rel, index) => {
			const edgeStyle = this.getEdgeStyle(rel.type);
			
			edges.push({
				id: `${rel.from}-${rel.to}-${index}`,
				source: rel.from,
				target: rel.to,
				type: edgeStyle.type,
				label: edgeStyle.label,
				animated: edgeStyle.animated,
				style: edgeStyle.style
			});
		});

		return edges;
	}

	private static getEdgeStyle(type: string): { type: string; label?: string; animated: boolean; style: Record<string, any> } {
		switch (type) {
			case 'extends':
				return {
					type: 'smoothstep',
					label: 'extends',
					animated: false,
					style: { stroke: '#ff6b6b', strokeWidth: 2 }
				};
			case 'implements':
				return {
					type: 'smoothstep',
					label: 'implements',
					animated: false,
					style: { stroke: '#4ecdc4', strokeWidth: 2, strokeDasharray: '5,5' }
				};
			case 'uses':
				return {
					type: 'smoothstep',
					animated: true,
					style: { stroke: '#95a5a6', strokeWidth: 1 }
				};
			case 'calls':
				return {
					type: 'smoothstep',
					label: 'HTTP',
					animated: true,
					style: { stroke: '#9b59b6', strokeWidth: 2, strokeDasharray: '8,4' }
				};
			default:
				return {
					type: 'default',
					animated: false,
					style: { stroke: '#000' }
				};
		}
	}

	static generateMermaidDiagram(diagramData: DiagramData): string {
		let mermaid = 'classDiagram\n';

		// Add classes
		for (const classInfo of diagramData.classes) {
			const classType = classInfo.isInterface ? '<<interface>>' : classInfo.isAbstract ? '<<abstract>>' : '';
			
			mermaid += `  class ${classInfo.name}${classType ? ' ' + classType : ''}\n`;
			
			// Add properties
			for (const prop of classInfo.properties) {
				const visibility = prop.visibility === 'private' ? '-' : prop.visibility === 'protected' ? '#' : '+';
				mermaid += `  ${classInfo.name} : ${visibility}${prop.name} ${prop.type}\n`;
			}

			// Add methods (limit to 5 for readability)
			for (const method of classInfo.methods.slice(0, 5)) {
				const visibility = method.visibility === 'private' ? '-' : method.visibility === 'protected' ? '#' : '+';
				const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
				mermaid += `  ${classInfo.name} : ${visibility}${method.name}(${params}) ${method.returnType}\n`;
			}
		}

		// Add relationships
		for (const rel of diagramData.relationships) {
			if (rel.type === 'extends') {
				mermaid += `  ${rel.to} <|-- ${rel.from}\n`;
			} else if (rel.type === 'implements') {
				mermaid += `  ${rel.to} <|.. ${rel.from}\n`;
			}
		}

		return mermaid;
	}
}
