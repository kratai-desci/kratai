import { DiagramData } from '../../types/domain';

export class MarkdownExporter {
	/**
	 * Export diagram data as Markdown format
	 */
	static toMarkdown(data: DiagramData, diagramName: string): string {
		let md = `# ${diagramName}\n\n`;
		md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
		
		// Enhanced summary stats
		const classTypeStats = this.getClassTypeStats(data);
		const relationshipStats = this.getRelationshipStats(data);
		
		md += `## 📊 Summary\n\n`;
		md += `- **Total Classes:** ${data.classes.length}\n`;
		md += `- **Total Relationships:** ${data.relationships.length}\n\n`;
		
		if (Object.keys(classTypeStats).length > 0) {
			md += `**Class Types:**\n`;
			for (const [type, count] of Object.entries(classTypeStats)) {
				md += `- ${this.getTypeEmoji(type)} ${type}: ${count}\n`;
			}
			md += `\n`;
		}
		
		if (Object.keys(relationshipStats).length > 0) {
			md += `**Relationship Types:**\n`;
			for (const [type, count] of Object.entries(relationshipStats)) {
				md += `- ${type}: ${count}\n`;
			}
			md += `\n`;
		}
		
		md += `---\n\n`;
		
	// Legend section
	md += `## 📖 Symbol Legend\n\n`;
	md += `**Visibility (UML Standard):**\n`;
	md += `- \`+\` = public\n`;
	md += `- \`-\` = private\n`;
	md += `- \`#\` = protected\n\n`;
	md += `**Git Status:**\n`;
	md += `- **[+ ADDED]** = newly added code\n`;
	md += `- **[- DELETED]** = removed code\n`;
	md += `- **[~ MODIFIED]** = changed code\n\n`;
	md += `---\n\n`;
	
	// Classes section
	md += `## 📦 Classes (${data.classes.length})\n\n`;
	
	for (const cls of data.classes) {
		// Class header with type indicator
			md += `**File:** \`${cls.filePath}\`\n\n`;
			
			// Class type and flags
			if (cls.classType && cls.classType !== 'class') {
				md += `**Type:** ${cls.classType}\n`;
			}
			if (cls.isInterface) {
				md += `**Interface:** ✅\n`;
			}
			if (cls.isAbstract) {
				md += `**Abstract:** ✅\n`;
			}
			if (cls.isModule) {
				md += `**Module:** ✅\n`;
			}
			md += `\n`;
			
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
		
		// Relationships section
		md += `## 🔗 Relationships (${data.relationships.length})\n\n`;
		
		if (data.relationships.length === 0) {
			md += `_No relationships found._\n\n`;
		} else {
			// Group relationships by type
			const byType = new Map<string, typeof data.relationships>();
			for (const rel of data.relationships) {
				if (!byType.has(rel.type)) {
					byType.set(rel.type, []);
				}
				byType.get(rel.type)!.push(rel);
			}
			
			// Output by type with better formatting
			for (const [type, rels] of byType) {
				md += `### ${type} (${rels.length})\n\n`;
				for (const rel of rels) {
					md += `- **${rel.from}** → **${rel.to}** _(${type})_`;
					
					// Format metadata more clearly
					if (rel.metadata) {
						const metaEntries = Object.entries(rel.metadata);
						if (metaEntries.length > 0) {
							md += `\n  - `;
							md += metaEntries
								.map(([k, v]) => `_${k}: ${v}_`)
								.join(', ');
						}
					}
					md += `\n`;
				}
				md += `\n`;
			}
		}
		
		return md;
	}
	
	/**
	 * Get class type statistics
	 */
	private static getClassTypeStats(data: DiagramData): Record<string, number> {
		const stats: Record<string, number> = {};
		for (const cls of data.classes) {
			const type = cls.classType || 'class';
			stats[type] = (stats[type] || 0) + 1;
		}
		return stats;
	}
	
	/**
	 * Get relationship type statistics
	 */
	private static getRelationshipStats(data: DiagramData): Record<string, number> {
		const stats: Record<string, number> = {};
		for (const rel of data.relationships) {
			stats[rel.type] = (stats[rel.type] || 0) + 1;
		}
		return stats;
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
	 * Get emoji for class type
	 */
	private static getTypeEmoji(type: string): string {
		const emojiMap: { [key: string]: string } = {
			'class': '📦',
			'interface': '🔷',
			'abstract': '🔶',
			'module': '📁',
			'enum': '🔢',
			'function': '⚡',
			'route': '🌐',
			'template': '📄',
			'middleware': '🛡️',
			'layout': '🎨',
			'page': '📃',
			'server-action': '⚙️',
			'model': '💾',
			'view': '👁️',
			'viewset': '📊',
			'serializer': '📋'
		};
		return emojiMap[type] || '📦';
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
