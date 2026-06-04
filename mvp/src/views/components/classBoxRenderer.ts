import { ClassInfo } from '../../types/diagram';
import { Position } from './layoutCalculator';

export class ClassBoxRenderer {
	constructor(private boxWidth: number) {}

	render(classInfo: ClassInfo, pos: Position): string {
		const className = classInfo.name;
		const isModule = className.startsWith('[');
		const borderColor = '#000000';
		const borderStyle = classInfo.isInterface ? 'dashed' : 'solid';
		const displayName = isModule ? className.slice(1, -1) : className;

		return `
			<div class="uml-box" data-class="${className}" style="
				position: absolute;
				left: ${pos.x}px;
				top: ${pos.y}px;
				width: ${this.boxWidth}px;
				background: white;
				border: 2px ${borderStyle} ${borderColor};
				border-radius: 0;
				box-shadow: 2px 2px 4px rgba(0,0,0,0.15);
				font-family: Arial, Helvetica, sans-serif;
				font-size: 12px;
				z-index: 100;
				pointer-events: auto;
				box-sizing: border-box;
			">
				${this.renderHeader(classInfo, isModule, displayName)}
				${this.renderProperties(classInfo, isModule)}
				${this.renderMethods(classInfo, isModule)}
			</div>
		`;
	}

	private renderHeader(classInfo: ClassInfo, isModule: boolean, displayName: string): string {
		const stereotype = isModule ? '«module»' : 
						   classInfo.isInterface ? '«interface»' : 
						   classInfo.isAbstract ? '«abstract»' : '';
		
		return `
			<div style="
				padding: 10px 8px;
				text-align: center;
				font-weight: bold;
				font-size: 14px;
				color: #000;
				border-bottom: 2px solid #000;
			">
				${stereotype ? `<div style="font-size: 11px; font-style: italic; font-weight: normal; margin-bottom: 4px;">${stereotype}</div>` : ''}
				<div>${displayName}</div>
			</div>
		`;
	}

	private renderProperties(classInfo: ClassInfo, isModule: boolean): string {
		const label = isModule ? 'No exports' : 'No properties';
		const items = classInfo.properties.slice(0, 5).map(prop => `
			<div style="padding: 3px 8px; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px;" title="${prop.name}: ${prop.type}">
				<span style="color: ${this.getVisibilityColor(prop.visibility)};">
					${this.getVisibilitySymbol(prop.visibility)}
				</span>
				${prop.name}: ${this.truncateType(prop.type)}
			</div>
		`).join('');

		const overflow = classInfo.properties.length > 5 ? 
			`<div style="color: #666; font-style: italic; padding: 3px 8px; font-size: 11px;">+${classInfo.properties.length - 5} more</div>` : '';

		return `
			<div style="
				padding: 8px 0;
				border-bottom: 1px solid #000;
				min-height: 30px;
				max-height: 90px;
				overflow: hidden;
				background: white;
			">
				${items || `<div style="color: #999; font-style: italic; padding: 3px 8px; font-size: 11px;">${label}</div>`}
				${overflow}
			</div>
		`;
	}

	private renderMethods(classInfo: ClassInfo, isModule: boolean): string {
		const label = isModule ? 'No functions' : 'No methods';
		const items = classInfo.methods.slice(0, 5).map(method => `
			<div style="padding: 3px 8px; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px;" 
				 title="${method.name}(${method.parameters.map(p => p.name).join(', ')})">
				<span style="color: ${this.getVisibilityColor(method.visibility)};">
					${this.getVisibilitySymbol(method.visibility)}
				</span>
				${method.name}(${this.truncateParams(method.parameters)})
			</div>
		`).join('');

		const overflow = classInfo.methods.length > 5 ? 
			`<div style="color: #666; font-style: italic; padding: 3px 8px; font-size: 11px;">+${classInfo.methods.length - 5} more</div>` : '';

		return `
			<div style="
				padding: 8px 0;
				min-height: 30px;
				max-height: 90px;
				overflow: hidden;
			">
				${items || `<div style="color: #999; font-style: italic; padding: 3px 8px; font-size: 11px;">${label}</div>`}
				${overflow}
			</div>
		`;
	}

	private truncateType(type: string): string {
		if (type.length > 20) {
			return type.substring(0, 17) + '...';
		}
		return type;
	}

	private truncateParams(parameters: any[]): string {
		if (parameters.length === 0) return '';
		if (parameters.length > 2) return '...';
		return parameters.map(p => p.name).join(', ');
	}

	private getVisibilityColor(visibility: 'public' | 'private' | 'protected'): string {
		return visibility === 'private' ? '#e74c3c' : 
			   visibility === 'protected' ? '#f39c12' : '#27ae60';
	}

	private getVisibilitySymbol(visibility: 'public' | 'private' | 'protected'): string {
		return visibility === 'private' ? '-' : 
			   visibility === 'protected' ? '#' : '+';
	}
}
