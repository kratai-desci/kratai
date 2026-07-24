import { DiagramData, ClassInfo } from '../../types/domain';
import { ReactFlowNode, ReactFlowEdge } from '../../types/view';
import { UMLRelationshipType } from '../../types/domain/UMLRelationshipType';
import { UMLMapper } from '../util';

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
			// Get detailed types from parsers (may be array after deduplication)
			const detailedTypes = Array.isArray(rel.type) ? rel.type : [rel.type as string];
			
			// Map to UML categories
			const umlTypes = detailedTypes.map(t => UMLMapper.mapToUMLType(t));
			
			// Remove duplicates (e.g., ["extends", "calls-super"] both map to their respective UML types)
			const uniqueUMLTypes = [...new Set(umlTypes)];
			
			// Use primary UML type for styling
			const primaryUMLType = uniqueUMLTypes[0];
			const edgeStyle = this.getEdgeStyle(primaryUMLType);
			
			edges.push({
				id: `${rel.from}-${rel.to}-${index}`,
				source: rel.from,
				target: rel.to,
				type: edgeStyle.type,
				label: edgeStyle.label,
				animated: edgeStyle.animated,
				style: edgeStyle.style,
				// Preserve detailed types in metadata for debugging/tooltips
				metadata: {
					umlType: primaryUMLType,
					detailedTypes: detailedTypes
				}
			});
		});

		return edges;
	}

	private static getEdgeStyle(umlType: UMLRelationshipType): { type: string; label?: string; animated: boolean; style: Record<string, any> } {
		switch (umlType) {
			// Inheritance: solid line, filled triangle marker
			case 'inheritance':
				return {
					type: 'smoothstep',
					label: UMLMapper.getUMLLabel(umlType),
					animated: false,
					style: { 
						stroke: '#000000',
						strokeWidth: 2
					}
				};
			
			// Realization: dashed line, hollow triangle marker
			case 'realization':
				return {
					type: 'smoothstep',
					label: UMLMapper.getUMLLabel(umlType),
					animated: false,
					style: { 
						stroke: '#000000',
						strokeWidth: 2,
						strokeDasharray: '5,5'
					}
				};
			
			// Dependency: dashed line, open arrow
			case 'dependency':
				return {
					type: 'smoothstep',
					label: UMLMapper.getUMLLabel(umlType),
					animated: false,
					style: { 
						stroke: '#000000',
						strokeWidth: 2,
						strokeDasharray: '5,5'
					}
				};
			
			// Association: solid line, simple arrow
			case 'association':
				return {
					type: 'smoothstep',
					label: UMLMapper.getUMLLabel(umlType),
					animated: false,
					style: { 
						stroke: '#000000',
						strokeWidth: 2
					}
				};
			
			default:
				return {
					type: 'default',
					animated: false,
					style: { stroke: '#000000' }
				};
		}
	}
}
