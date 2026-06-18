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
		// Unique ID used to match edges: filePath__className
		const uniqueId = this.escapeHtml(`${classInfo.filePath}__${classInfo.name}`);
		
		// Get background color based on change status
		const bgColor = this.getChangeStatusBgColor(classInfo.changeStatus || 'unchanged');

		return `
			<div class="uml-box ${classInfo.changeStatus ? `change-${classInfo.changeStatus}` : ''}" data-class="${uniqueId}" data-file-path="${this.escapeHtml(classInfo.filePath)}" style="
				width: ${this.boxWidth}px;
				background: ${bgColor};
				border: 2px ${borderStyle} ${borderColor};
				border-radius: 0;
				box-shadow: 2px 2px 4px rgba(0,0,0,0.15);
				font-family: Arial, Helvetica, sans-serif;
				font-size: 12px;
				pointer-events: auto;
				box-sizing: border-box;
				position: relative;
			">
				<button class="open-file-btn" title="Open in Editor">⋮</button>
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
		const items = classInfo.properties.map(prop => {
			const safeName = this.escapeHtml(prop.name);
			const safeType = this.escapeHtml(prop.type);
			const safeTruncatedType = this.escapeHtml(this.truncateType(prop.type));
			const changeBgColor = this.getMemberChangeStatusBgColor(prop.changeStatus);
			const safeFilePath = this.escapeHtml(classInfo.filePath);
			const lineNumber = prop.lineNumber || 1;
			const endLineNumber = prop.endLineNumber || lineNumber;
			
			return `
			<div class="member-item clickable" 
				 style="padding: 3px 8px; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px; background: ${changeBgColor}; cursor: pointer;" 
				 title="${safeName}: ${safeType} (click to open)"
				 onclick="openMember('${safeFilePath}', ${lineNumber}, ${endLineNumber}, '${safeName}')">
				<span style="color: ${this.getVisibilityColor(prop.visibility)};">
					${this.getVisibilitySymbol(prop.visibility)}
				</span>
				<span>${safeName}: ${safeTruncatedType}</span>
			</div>
		`;
		}).join('');

		// Use class-level background color if class is deleted/added
		const sectionBgColor = (classInfo.changeStatus === 'deleted' || classInfo.changeStatus === 'added') 
			? this.getChangeStatusBgColor(classInfo.changeStatus) 
			: 'white';

		return `
			<div style="
				padding: 8px 0;
				border-bottom: 1px solid #000;
				min-height: 30px;
				background: ${sectionBgColor};
			">
				${items || `<div style="color: #999; font-style: italic; padding: 3px 8px; font-size: 11px;">${label}</div>`}
			</div>
		`;
	}

	private renderMethods(classInfo: ClassInfo, isModule: boolean): string {
		const label = isModule ? 'No functions' : 'No methods';
		const items = classInfo.methods.map(method => {
			const safeName = this.escapeHtml(method.name);
			const safeParams = this.escapeHtml(this.truncateParams(method.parameters));
			const paramNames = method.parameters.map(p => this.escapeHtml(p.name)).join(', ');
			const changeBgColor = this.getMemberChangeStatusBgColor(method.changeStatus);
			const safeFilePath = this.escapeHtml(classInfo.filePath);
			const lineNumber = method.lineNumber || 1;
			const endLineNumber = method.endLineNumber || lineNumber;
			
			return `
			<div class="member-item clickable" 
				 style="padding: 3px 8px; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px; ${changeBgColor !== 'transparent' ? `background: ${changeBgColor};` : 'background: rgba(100, 150, 200, 0.05);'} cursor: pointer;" 
				 title="${safeName}(${paramNames}) (click to open)"
				 onclick="openMember('${safeFilePath}', ${lineNumber}, ${endLineNumber}, '${safeName}')">
				<span style="color: ${this.getVisibilityColor(method.visibility)};">
					${this.getVisibilitySymbol(method.visibility)}
				</span>
				<span>${safeName}(${safeParams})</span>
			</div>
		`;
		}).join('');

		// Use class-level background color if class is deleted/added
		const sectionBgColor = (classInfo.changeStatus === 'deleted' || classInfo.changeStatus === 'added') 
			? this.getChangeStatusBgColor(classInfo.changeStatus) 
			: 'white';

		return `
			<div style="
				padding: 8px 0;
				min-height: 30px;
				background: ${sectionBgColor};
			">
				${items || `<div style="color: #999; font-style: italic; padding: 3px 8px; font-size: 11px;">${label}</div>`}
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

	private getChangeStatusBgColor(status: 'added' | 'deleted' | 'modified' | 'unchanged'): string {
		switch (status) {
			case 'added': return '#a8e6a1'; // Bright green
			case 'deleted': return '#ffb3ba'; // Bright red
			case 'modified': return 'white'; // Keep white, members will show changes
			case 'unchanged': 
			default: return 'white';
		}
	}

	private getMemberChangeStatusBgColor(status?: 'added' | 'deleted' | 'modified' | 'unchanged'): string {
		if (!status || status === 'unchanged') return 'transparent';
		switch (status) {
			case 'added': return '#a8e6a1'; // Bright green
			case 'deleted': return '#ffb3ba'; // Bright red
			case 'modified': return '#ffe066'; // Bright yellow
			default: return 'transparent';
		}
	}

}
