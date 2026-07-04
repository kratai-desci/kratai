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
		
		// Build relationship maps for each class
		const usesMap = new Map<string, Array<{to: string, type: string[]}>>();
		const usedByMap = new Map<string, Array<{from: string, type: string[]}>>();
		
		for (const rel of data.relationships) {
			const types = Array.isArray(rel.type) ? rel.type : [rel.type as string];
			
			// Outgoing relationships (Uses)
			if (!usesMap.has(rel.from)) {
				usesMap.set(rel.from, []);
			}
			usesMap.get(rel.from)!.push({ to: rel.to, type: types });
			
			// Incoming relationships (Used By)
			if (!usedByMap.has(rel.to)) {
				usedByMap.set(rel.to, []);
			}
			usedByMap.get(rel.to)!.push({ from: rel.from, type: types });
		}
		
		// Classes section
		md += `## 📦 Classes (${data.classes.length})\n\n`;
	
		for (const cls of data.classes) {
			const classId = `${cls.filePath}__${cls.name}`;
			
			// Class header - just name with type
			md += `**${cls.name}**`;
			if (cls.classType && cls.classType !== 'class') {
				md += ` _(${cls.classType})_`;
			}
			md += `\n`;
			
			// Extends
			if (cls.extends) {
				md += `**Extends:** ${cls.extends}\n`;
			}
			
			// Implements
			if (cls.implements && cls.implements.length > 0) {
				md += `**Implements:** ${cls.implements.join(', ')}\n`;
			}
			
			// Properties
			if (cls.properties && cls.properties.length > 0) {
				md += `**Properties:**\n`;
				for (const prop of cls.properties) {
					const visibility = this.getVisibilitySymbol(prop.visibility);
					const staticTag = prop.isStatic ? ' _[static]_' : '';
					const readonlyTag = prop.isReadonly ? ' _[readonly]_' : '';
					const changeStatus = this.getChangeStatusTag(prop.changeStatus);
					md += `- ${visibility} ${prop.name}: ${prop.type}${staticTag}${readonlyTag}${changeStatus}\n`;
				}
				md += `\n`;
			}
			
			// Methods
			if (cls.methods && cls.methods.length > 0) {
				md += `**Methods:**\n`;
				for (const method of cls.methods) {
					const visibility = this.getVisibilitySymbol(method.visibility);
					const staticTag = method.isStatic ? ' _[static]_' : '';
					const asyncTag = method.isAsync ? ' _[async]_' : '';
					const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
					const changeStatus = this.getChangeStatusTag(method.changeStatus);
					md += `- ${visibility} ${method.name}(${params}): ${method.returnType}${staticTag}${asyncTag}${changeStatus}\n`;
				}
				md += `\n`;
			}
			
			// Uses (outgoing relationships)
			const uses = usesMap.get(classId);
			if (uses && uses.length > 0) {
				md += `**Uses:**\n`;
				for (const {to, type} of uses) {
					// Extract just the class name from the ID (remove path__)
					const toName = to.includes('__') ? to.split('__').pop()! : to;
					md += `- ${toName} _(${type.join(', ')})_\n`;
				}
				md += `\n`;
			}
			
			// Used By (incoming relationships)
			const usedBy = usedByMap.get(classId);
			if (usedBy && usedBy.length > 0) {
				md += `**Used By:**\n`;
				for (const {from, type} of usedBy) {
					// Extract just the class name from the ID (remove path__)
					const fromName = from.includes('__') ? from.split('__').pop()! : from;
					md += `- ${fromName} _(${type.join(', ')})_\n`;
				}
				md += `\n`;
			}
			
			md += `---\n\n`;
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
