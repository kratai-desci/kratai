import { ClassInfo } from '@kratai/analysis';

export class ClassBoxRenderer {
	constructor(private boxWidth: number, private hasLiveHost: boolean = false) {}

	render(classInfo: ClassInfo, relationshipMap?: Map<string, Array<{target: string, type: string}>>): string {
		const className = classInfo.name;
		const isModule = className.startsWith('[');
		const borderStyle = classInfo.isInterface ? 'dashed' : 'solid';
		const displayName = isModule ? className.slice(1, -1) : className;

		// Escape HTML to prevent malformed attributes
		const safeClassName = this.escapeHtml(className);
		const safeDisplayName = this.escapeHtml(displayName);
		// Unique ID used to match edges: filePath__className
		const uniqueId = this.escapeHtml(`${classInfo.filePath}__${classInfo.name}`);

		const statusClass = classInfo.changeStatus && classInfo.changeStatus !== 'unchanged'
			? ` change-${classInfo.changeStatus}`
			: '';
		// An added/deleted class floods every row with its own tint; a
		// modified class only tints the specific rows that changed.
		const rowFlood = (classInfo.changeStatus === 'added' || classInfo.changeStatus === 'deleted')
			? classInfo.changeStatus
			: undefined;

		return `
			<div class="uml-box${statusClass}" data-class="${uniqueId}" data-file-path="${this.escapeHtml(classInfo.filePath)}" style="
				width: ${this.boxWidth}px;
				border-style: ${borderStyle};
			">
				${this.hasLiveHost ? '<button class="open-file-btn" title="Open in Editor">⋮</button>' : ''}
				${this.renderHeader(classInfo, isModule, safeDisplayName)}
				${this.renderProperties(classInfo, isModule, rowFlood)}
				${this.renderMethods(classInfo, isModule, rowFlood)}
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
		const stereotype = isModule ? 'module' :
						   classInfo.isInterface ? 'interface' :
						   classInfo.isAbstract ? 'abstract' : '';

		return `
			<div class="box-header">
				${stereotype ? `<div class="stereo">«${stereotype}»</div>` : ''}
				<div class="box-name">${displayName}</div>
			</div>
		`;
	}

	private renderProperties(classInfo: ClassInfo, isModule: boolean, rowFlood?: 'added' | 'deleted'): string {
		const label = isModule ? 'No exports' : 'No properties';
		const items = classInfo.properties.map(prop => this.renderRow({
			name: prop.name,
			typeOrParams: `: ${this.truncateType(prop.type)}`,
			title: `${prop.name}: ${prop.type}`,
			visibility: prop.visibility,
			changeStatus: prop.changeStatus,
			rowFlood,
			filePath: classInfo.filePath,
			lineNumber: prop.lineNumber,
			endLineNumber: prop.endLineNumber
		})).join('');

		return `<div class="section">${items || this.renderEmptyRow(label)}</div>`;
	}

	private renderMethods(classInfo: ClassInfo, isModule: boolean, rowFlood?: 'added' | 'deleted'): string {
		const label = isModule ? 'No functions' : 'No methods';
		const items = classInfo.methods.map(method => this.renderRow({
			name: method.name,
			typeOrParams: `(${this.truncateParams(method.parameters)})`,
			title: `${method.name}(${method.parameters.map(p => p.name).join(', ')})`,
			visibility: method.visibility,
			changeStatus: method.changeStatus,
			rowFlood,
			filePath: classInfo.filePath,
			lineNumber: method.lineNumber,
			endLineNumber: method.endLineNumber
		})).join('');

		return `<div class="section">${items || this.renderEmptyRow(label)}</div>`;
	}

	private renderRow(row: {
		name: string;
		typeOrParams: string;
		title: string;
		visibility: 'public' | 'private' | 'protected';
		changeStatus?: 'added' | 'deleted' | 'modified' | 'unchanged';
		rowFlood?: 'added' | 'deleted';
		filePath: string;
		lineNumber?: number;
		endLineNumber?: number;
	}): string {
		const safeName = this.escapeHtml(row.name);
		const safeTypeOrParams = this.escapeHtml(row.typeOrParams);
		const safeTitle = this.escapeHtml(row.title);
		const status = row.rowFlood || (row.changeStatus !== 'unchanged' ? row.changeStatus : undefined);
		const statusClass = status ? ` status-${status}` : '';
		const safeFilePath = this.escapeHtml(row.filePath);
		const lineNumber = row.lineNumber || 1;
		const endLineNumber = row.endLineNumber || lineNumber;

		const clickableAttrs = this.hasLiveHost
			? `class="member-item clickable${statusClass}" title="${safeTitle} (click to open)" onclick="openMember(event, '${safeFilePath}', ${lineNumber}, ${endLineNumber}, '${safeName}')"`
			: `class="member-item${statusClass}" title="${safeTitle}"`;

		return `
			<div ${clickableAttrs}>
				<span class="vis ${row.visibility}"></span>
				<span class="rname">${safeName}</span><span class="rtype">${safeTypeOrParams}</span>
			</div>
		`;
	}

	private renderEmptyRow(label: string): string {
		return `<div class="member-item empty">${label}</div>`;
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
}
