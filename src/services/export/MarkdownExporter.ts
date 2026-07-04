import { DiagramData } from '../../types/domain';

export class MarkdownExporter {
	/**
	 * Export diagram data as Markdown format
	 */
	static toMarkdown(data: DiagramData, diagramName: string): string {
		let md = `# ${diagramName}\n\n`;
		md += `Generated: ${new Date().toLocaleString()}\n`;
		md += `Total: ${data.classes.length} classes, ${data.relationships.length} relationships\n\n`;
		md += `---\n\n`;
		
		// Folder structure
		md += `## Project Structure\n\n`;
		md += this.generateFolderTree(data);
		md += `\n---\n\n`;
		
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
		md += `## Classes (${data.classes.length})\n\n`;
	
			for (const cls of data.classes) {
			const classId = `${cls.filePath}__${cls.name}`;
			
			// Class header - just name with type
			md += `${cls.name}`;
			if (cls.classType && cls.classType !== 'class') {
				md += ` (${cls.classType})`;
			}
			md += `\n`;
			
			// Extends
			if (cls.extends) {
				md += `Extends: ${cls.extends}\n`;
			}
			
			// Implements
			if (cls.implements && cls.implements.length > 0) {
				md += `Implements: ${cls.implements.join(', ')}\n`;
			}
			
			// Properties
			if (cls.properties && cls.properties.length > 0) {
				md += `Properties:\n`;
				for (const prop of cls.properties) {
					const visibility = this.getVisibilitySymbol(prop.visibility);
					const staticTag = prop.isStatic ? ' [static]' : '';
					const readonlyTag = prop.isReadonly ? ' [readonly]' : '';
					const changeStatus = this.getChangeStatusTag(prop.changeStatus);
					md += `- ${visibility} ${prop.name}: ${prop.type}${staticTag}${readonlyTag}${changeStatus}\n`;
				}
			}
			
			// Methods
			if (cls.methods && cls.methods.length > 0) {
				md += `Methods:\n`;
				for (const method of cls.methods) {
					const visibility = this.getVisibilitySymbol(method.visibility);
					const staticTag = method.isStatic ? ' [static]' : '';
					const asyncTag = method.isAsync ? ' [async]' : '';
					const params = method.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
					const changeStatus = this.getChangeStatusTag(method.changeStatus);
					md += `- ${visibility} ${method.name}(${params}): ${method.returnType}${staticTag}${asyncTag}${changeStatus}\n`;
				}
			}
			
			// Uses (outgoing relationships)
			const uses = usesMap.get(classId);
			if (uses && uses.length > 0) {
				md += `Uses:\n`;
				for (const {to, type} of uses) {
					// Extract just the class name from the ID (remove path__)
					const toName = to.includes('__') ? to.split('__').pop()! : to;
					md += `- ${toName} (${type.join(', ')})\n`;
				}
			}
			
			// Used By (incoming relationships)
			const usedBy = usedByMap.get(classId);
			if (usedBy && usedBy.length > 0) {
				md += `Used By:\n`;
				for (const {from, type} of usedBy) {
					// Extract just the class name from the ID (remove path__)
					const fromName = from.includes('__') ? from.split('__').pop()! : from;
					md += `- ${fromName} (${type.join(', ')})\n`;
				}
			}
			
			md += `---\n\n`;
		}
		
		return md;
	}
	
	/**
	 * Generate a compact folder tree structure
	 */
	private static generateFolderTree(data: DiagramData): string {
		// Extract unique file paths
		const filePaths = [...new Set(data.classes.map(c => c.filePath))].sort();
		
		// Build tree structure
		interface TreeNode {
			[key: string]: TreeNode | null;
		}
		const tree: TreeNode = {};
		
		for (const filePath of filePaths) {
			const parts = filePath.split('/');
			let current = tree;
			
			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				if (!current[part]) {
					current[part] = i === parts.length - 1 ? null : {};
				}
				if (current[part] !== null) {
					current = current[part] as TreeNode;
				}
			}
		}
		
		// Render tree
		let result = '```\n';
		
		const renderNode = (node: TreeNode, prefix: string = '', isLast: boolean = true) => {
			const entries = Object.entries(node);
			entries.forEach(([key, value], index) => {
				const isLastEntry = index === entries.length - 1;
				const connector = isLastEntry ? '└── ' : '├── ';
				const extension = prefix + connector + key;
				
				result += extension + '\n';
				
				if (value !== null) {
					const newPrefix = prefix + (isLastEntry ? '    ' : '│   ');
					renderNode(value, newPrefix, isLastEntry);
				}
			});
		};
		
		renderNode(tree);
		result += '```';
		
		return result;
	}
	
	/**
	 * Get change status tag for git diff
	 */
	private static getChangeStatusTag(status?: string): string {
		switch (status) {
			case 'added': return ' [ADDED]';
			case 'deleted': return ' [DELETED]';
			case 'modified': return ' [MODIFIED]';
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
