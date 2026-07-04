import { DiagramData } from '../../types/domain';

export class MarkdownExporter {
	/**
	 * Export diagram data as Markdown format
	 */
	static toMarkdown(data: DiagramData, diagramName: string): string {
		let md = `# ${diagramName}\n\n`;
		md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
		md += `**Total:** ${data.classes.length} classes, ${data.relationships.length} relationships\n\n`;
		md += `---\n\n`;
		
		// Classes section
		md += `## 📦 Classes (${data.classes.length})\n\n`;
	
	for (const cls of data.classes) {
			// Compact class header with type suffix
			md += `**File:** \`${cls.filePath}\``;
			if (cls.classType && cls.classType !== 'class') {
				md += ` _(${cls.classType})_`;
			}
			md += `\n\n`;
			
			// Extends
			if (cls.extends) {
				md += `**Extends:** ${cls.extends}\n\n`;
			}
			
			// Implements
			if (cls.implements && cls.implements.length > 0) {
				md += `**Implements:** ${cls.implements.join(', ')}\n\n`;
			}
			
			// Properties
			if (cls.properties && cls.properties.length > 0) {
				md += `**Properties:**\n\n`;
				for (const prop of cls.properties) {
					const visibility = this.getVisibilitySymbol(prop.visibility);
					const staticTag = prop.isStatic ? ' _[static]_' : '';
					const readonlyTag = prop.isReadonly ? ' _[readonly]_' : '';
					const lineInfo = prop.lineNumber ? ` _[line ${prop.lineNumber}]_` : '';
					const changeStatus = this.getChangeStatusTag(prop.changeStatus);
					md += `- ${visibility} \`${prop.name}\`: ${prop.type}${staticTag}${readonlyTag}${lineInfo}${changeStatus}\n`;
				}
				md += `\n`;
			}
			
			// Methods
			if (cls.methods && cls.methods.length > 0) {
				md += `**Methods:**\n\n`;
				for (const method of cls.methods) {
					const visibility = this.getVisibilitySymbol(method.visibility);
					const staticTag = method.isStatic ? ' _[static]_' : '';
					const asyncTag = method.isAsync ? ' _[async]_' : '';
					const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
					const lineInfo = method.lineNumber ? ` _[line ${method.lineNumber}${method.endLineNumber && method.endLineNumber !== method.lineNumber ? `-${method.endLineNumber}` : ''}]_` : '';
					const changeStatus = this.getChangeStatusTag(method.changeStatus);
					md += `- ${visibility} \`${method.name}(${params})\`: ${method.returnType}${staticTag}${asyncTag}${lineInfo}${changeStatus}\n`;
				}
				md += `\n`;
			}
			
			md += `---\n\n`;
		}
		
		// Relationships section - grouped by source for compactness
		md += `## 🔗 Relationships (${data.relationships.length})\n\n`;
		
		if (data.relationships.length === 0) {
			md += `_No relationships found._\n\n`;
		} else {
			// Group relationships by source (from)
			const bySource = new Map<string, Array<{to: string, type: string[]}>>();
			
			for (const rel of data.relationships) {
				const types = Array.isArray(rel.type) ? rel.type : [rel.type as string];
				
				if (!bySource.has(rel.from)) {
					bySource.set(rel.from, []);
				}
				bySource.get(rel.from)!.push({ to: rel.to, type: types });
			}
			
			// Output grouped by source
			for (const [from, targets] of bySource) {
				md += `**${from}** →\n`;
				for (const {to, type} of targets) {
					md += `  - ${to} _(${type.join(', ')})_\n`;
				}
				md += `\n`;
			}
		}
		
		return md;
	}
	
	/**
	 * Get change status tag for git diff
	 */
	private static getChangeStatusTag(status?: string): string {
		switch (status) {
			case 'added': return ' **[+ ADDED]**';
			case 'deleted': return ' **[- DELETED]**';
			case 'modified': return ' **[~ MODIFIED]**';
			default: return '';
		}
	}
	
	/**
	 * Get visibility symbol (UML notation)
	 */
	private static getVisibilitySymbol(visibility: string): string {
		switch (visibility) {
			case 'public': return '+';
			case 'private': return '-';
			case 'protected': return '#';
			default: return '~';
		}
	}
}
