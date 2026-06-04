import { ReactFlowEdge } from '../../types/diagram';
import { Position } from './layoutCalculator';

export class RelationshipRenderer {
	constructor(
		private boxWidth: number,
		private boxHeight: number
	) {}

	renderAll(edges: ReactFlowEdge[], classPositions: Map<string, Position>): string {
		return edges.map(edge => this.render(edge, classPositions)).join('');
	}

	private render(edge: ReactFlowEdge, classPositions: Map<string, Position>): string {
		const sourcePos = classPositions.get(edge.source);
		const targetPos = classPositions.get(edge.target);
		
		if (!sourcePos || !targetPos) return '';

		const sourceX = sourcePos.x + this.boxWidth / 2;
		const sourceY = sourcePos.y + this.boxHeight / 2;
		const targetX = targetPos.x + this.boxWidth / 2;
		const targetY = targetPos.y + this.boxHeight / 2;

		const color = this.getEdgeColor(edge.type);
		const dashArray = this.getDashArray(edge.type);
		const markerEnd = this.getMarkerEnd(edge.type);
		const strokeWidth = edge.type === 'uses' ? '1.5' : '2.5';
		const opacity = edge.type === 'uses' ? '0.5' : '0.9';
		
		// Draw curved line for better visibility
		const { controlX, controlY } = this.calculateCurve(sourceX, sourceY, targetX, targetY);
		
		return `
			<path 
				d="M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}"
				stroke="${color}"
				stroke-width="${strokeWidth}"
				fill="none"
				stroke-dasharray="${dashArray}"
				marker-end="${markerEnd}"
				opacity="${opacity}"
			/>
		`;
	}

	private calculateCurve(sourceX: number, sourceY: number, targetX: number, targetY: number) {
		const midX = (sourceX + targetX) / 2;
		const midY = (sourceY + targetY) / 2;
		const dx = targetX - sourceX;
		const dy = targetY - sourceY;
		const dist = Math.sqrt(dx * dx + dy * dy);
		const offset = Math.min(25, dist / 5);
		const controlX = midX - dy * offset / dist;
		const controlY = midY + dx * offset / dist;
		
		return { controlX, controlY };
	}

	private getEdgeColor(type: string): string {
		switch (type) {
			case 'extends': return '#000000';
			case 'implements': return '#000000';
			case 'uses': return '#666666';
			default: return '#666666';
		}
	}

	private getDashArray(type: string): string {
		switch (type) {
			case 'implements': return '5,5';
			case 'uses': return '3,3';
			default: return '0';
		}
	}

	private getMarkerEnd(type: string): string {
		switch (type) {
			case 'implements': return 'url(#triangle-implements)';
			case 'uses': return 'url(#arrow-uses)';
			default: return 'url(#triangle-extends)';
		}
	}

	renderMarkerDefs(): string {
		return `
			<defs>
				<!-- Inheritance arrow: white triangle with black border -->
				<marker id="triangle-extends" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
					<polygon points="0,0 0,10 10,5" fill="white" stroke="#000000" stroke-width="2" />
				</marker>
				<!-- Implementation arrow: white triangle with black border -->
				<marker id="triangle-implements" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
					<polygon points="0,0 0,10 10,5" fill="white" stroke="#000000" stroke-width="2" />
				</marker>
				<!-- Association arrow: simple open arrow -->
				<marker id="arrow-uses" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
					<path d="M 0,0 L 10,5 L 0,10" fill="none" stroke="#666666" stroke-width="2" />
				</marker>
			</defs>
		`;
	}
}
