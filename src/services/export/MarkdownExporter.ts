import { DiagramData } from '../../types/domain';

export class MarkdownExporter {
	/**
	 * Export diagram data as Markdown format
	 */
	static toMarkdown(data: DiagramData, diagramName: string): string {
		let md = `# ${diagramName}\n\n`;
		md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
		md += `**Summary:** ${data.classes.length} classes, ${data.relationships.length} relationships\n\n`;
		md += `---\n\n`;
		
		// Classes section
		md += `## Classes (${data.classes.length})\n\n`;
		
		for (const cls of data.classes) {
			// Class header with type indicator
			const classType = cls.classType || 'class';
			const typeEmoji = this.getTypeEmoji(classType);
			md += `### ${typeEmoji} ${cls.name}\n\n`;
			
			// File path
			md += `**File:** \`${cls.filePath}\`\n\n`;
			
			// Class type
			if (cls.classType && cls.classType !== 'class') {
				md += `**Type:** ${cls.classType}\n\n`;
			}
			
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
					md += `- ${visibility} \`${prop.name}\`: ${prop.type}${staticTag}${readonlyTag}\n`;
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
					md += `- ${visibility} \`${method.name}(${params})\`: ${method.returnType}${staticTag}${asyncTag}\n`;
				}
				md += `\n`;
			}
			
			md += `---\n\n`;
		}
		
		// Relationships section
		md += `## Relationships (${data.relationships.length})\n\n`;
		
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
			
			// Output by type
			for (const [type, rels] of byType) {
				md += `### ${type} (${rels.length})\n\n`;
				for (const rel of rels) {
					md += `- **${rel.from}** → **${rel.to}**`;
					if (rel.metadata) {
						const metaStr = Object.entries(rel.metadata)
							.map(([k, v]) => `${k}: ${v}`)
							.join(', ');
						md += ` _(${metaStr})_`;
					}
					md += `\n`;
				}
				md += `\n`;
			}
		}
		
		return md;
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
	 * Get visibility symbol
	 */
	private static getVisibilitySymbol(visibility: string): string {
		switch (visibility) {
			case 'public': return '🟢';
			case 'private': return '🔴';
			case 'protected': return '🟡';
			default: return '⚪';
		}
	}
}
