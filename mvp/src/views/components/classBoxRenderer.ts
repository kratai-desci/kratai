import { ClassInfo } from '../../types/diagram';
import { Position } from './layoutCalculator';

export class ClassBoxRenderer {
	constructor(private boxWidth: number) {}

	render(classInfo: ClassInfo, relationshipMap?: Map<string, Array<{target: string, type: string}>>): string {
		const className = classInfo.name;
		const isModule = className.startsWith('[');
		const borderColor = '#000000';
		const borderStyle = classInfo.isInterface ? 'dashed' : 'solid';
		const displayName = isModule ? className.slice(1, -1) : className;
		
		// Escape HTML to prevent malformed attributes
		const safeClassName = this.escapeHtml(className);
		const safeDisplayName = this.escapeHtml(displayName);

		return `
			<div class="uml-box" data-class="${safeClassName}" style="
				width: ${this.boxWidth}px;
				background: white;
				border: 2px ${borderStyle} ${borderColor};
				border-radius: 0;
				box-shadow: 2px 2px 4px rgba(0,0,0,0.15);
				font-family: Arial, Helvetica, sans-serif;
				font-size: 12px;
				pointer-events: auto;
				box-sizing: border-box;
				position: relative;
			">
				${this.renderHeader(classInfo, isModule, safeDisplayName)}
				${this.renderProperties(classInfo, isModule)}
				${this.renderMethods(classInfo, isModule)}
			</div>
		`;
	}
	
	private escapeHtml(text: string): string {
		// Escape HTML special characters to prevent breaking HTML structure
		// Critical for: generics (Array<T>), templates (vector<string>), 
		// type annotations (Dict[str, int]), and special operators (&, |, etc.)
		return text
			.replace(/&/g, '&amp;')   // Must be first to avoid double-escaping
			.replace(/</g, '&lt;')    // Generics: Array<T>, Promise<void>, List<String>
			.replace(/>/g, '&gt;')    // Templates: vector<int>, map<K,V>
			.replace(/"/g, '&quot;')  // Prevent attribute breaking
			.replace(/'/g, '&#039;')  // Prevent single-quote issues
			.replace(/\n/g, ' ')      // Multi-line types to single line
			.replace(/\t/g, ' ')      // Tabs to spaces
			.replace(/\s+/g, ' ');    // Collapse multiple spaces
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
		const items = classInfo.properties.slice(0, 5).map(prop => {
			const safeName = this.escapeHtml(prop.name);
			const safeType = this.escapeHtml(prop.type);
			const safeTruncatedType = this.escapeHtml(this.truncateType(prop.type));
			
			return `
			<div style="padding: 3px 8px; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px;" title="${safeName}: ${safeType}">
				<span style="color: ${this.getVisibilityColor(prop.visibility)};">
					${this.getVisibilitySymbol(prop.visibility)}
				</span>
				<span>${safeName}: ${safeTruncatedType}</span>
			</div>
		`;
		}).join('');

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
		const items = classInfo.methods.slice(0, 5).map(method => {
			const safeName = this.escapeHtml(method.name);
			const safeParams = this.escapeHtml(this.truncateParams(method.parameters));
			const paramNames = method.parameters.map(p => this.escapeHtml(p.name)).join(', ');
			
			return `
			<div style="padding: 3px 8px; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px;" 
				 title="${safeName}(${paramNames})">
				<span style="color: ${this.getVisibilityColor(method.visibility)};">
					${this.getVisibilitySymbol(method.visibility)}
				</span>
				<span>${safeName}(${safeParams})</span>
			</div>
		`;
		}).join('');

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
