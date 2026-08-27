import { ClassInfo, DiagramData } from '../types/domain';
import { FolderConfig } from '../types/config';

export interface RelationshipMaps {
	usesMap: Map<string, Array<{ to: string; type: string[] }>>;
	usedByMap: Map<string, Array<{ from: string; type: string[] }>>;
}

export class MarkdownExporter {
	/**
	 * Export diagram data as Markdown format.
	 *
	 * `folders`, when given, is the same per-folder `hidden` state `kratai
	 * view`'s eye-toggle already writes to kratai.local.json - previously
	 * only ever read for the interactive view's own rendering, never for
	 * this export, so hiding noise (generated clients, migrations, whatever
	 * isn't architecturally interesting) in the view never actually reduced
	 * what an agent or a pasted-into-a-PR export saw. A folder hidden here
	 * is dropped from the output entirely, not just visually dimmed - this
	 * export has no "collapsed but present" state the way the 3D view does.
	 */
	static toMarkdown(data: DiagramData, diagramName: string, folders?: Record<string, FolderConfig>): string {
		const visibleData = this.excludeHiddenFolders(data, folders);

		let md = `# ${diagramName}\n\n`;
		md += `Generated: ${new Date().toLocaleString()}\n`;
		md += `Total: ${visibleData.classes.length} classes, ${visibleData.relationships.length} relationships\n\n`;
		md += `---\n\n`;
		
		// Folder structure
		md += `## Project Structure\n\n`;
		md += this.generateFolderTree(visibleData);
		md += `\n---\n\n`;

		const { usesMap, usedByMap } = this.buildRelationshipMaps(visibleData);

		// Classes section
		md += `## Classes (${visibleData.classes.length})\n\n`;

		for (const cls of visibleData.classes) {
			md += this.formatClassBlock(cls, usesMap, usedByMap);
		}

		return md;
	}

	/**
	 * Groups every relationship by both directions (from -> "uses", to ->
	 * "used by"), keyed by the same `filePath__ClassName` id used throughout
	 * this exporter. Extracted out of toMarkdown() so other callers needing
	 * a single class's relationships (e.g. a `kratai detail` lookup) don't
	 * have to re-derive this from raw relationships themselves.
	 */
	static buildRelationshipMaps(data: DiagramData): RelationshipMaps {
		const usesMap: RelationshipMaps['usesMap'] = new Map();
		const usedByMap: RelationshipMaps['usedByMap'] = new Map();

		for (const rel of data.relationships) {
			const types = Array.isArray(rel.type) ? rel.type : [rel.type as string];

			if (!usesMap.has(rel.from)) usesMap.set(rel.from, []);
			usesMap.get(rel.from)!.push({ to: rel.to, type: types });

			if (!usedByMap.has(rel.to)) usedByMap.set(rel.to, []);
			usedByMap.get(rel.to)!.push({ from: rel.from, type: types });
		}

		return { usesMap, usedByMap };
	}

	/**
	 * Formats one class's full detail block (header, extends/implements,
	 * properties, methods, uses/used-by) - the same block toMarkdown() puts
	 * per class in the full dump, extracted so a single-class lookup (e.g.
	 * `kratai detail`) can produce an identical block for just one class
	 * without duplicating the formatting.
	 */
	static formatClassBlock(cls: ClassInfo, usesMap: RelationshipMaps['usesMap'], usedByMap: RelationshipMaps['usedByMap']): string {
		const classId = `${cls.filePath}__${cls.name}`;
		let md = '';

		md += `${cls.name}`;
		if (cls.classType && cls.classType !== 'class') {
			md += ` (${cls.classType})`;
		}
		md += `\n`;

		if (cls.extends) {
			md += `Extends: ${cls.extends}\n`;
		}

		if (cls.implements && cls.implements.length > 0) {
			md += `Implements: ${cls.implements.join(', ')}\n`;
		}

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

		const uses = usesMap.get(classId);
		if (uses && uses.length > 0) {
			const usesList = uses.map(({ to, type }) => {
				const toName = to.includes('__') ? to.split('__').pop()! : to;
				return `${toName} (${type.join(', ')})`;
			});
			md += `Uses: ${usesList.join(', ')}\n`;
		}

		const usedBy = usedByMap.get(classId);
		if (usedBy && usedBy.length > 0) {
			const usedByList = usedBy.map(({ from, type }) => {
				const fromName = from.includes('__') ? from.split('__').pop()! : from;
				return `${fromName} (${type.join(', ')})`;
			});
			md += `Used By: ${usedByList.join(', ')}\n`;
		}

		md += `---\n\n`;
		return md;
	}

	/**
	 * Drops classes (and any relationship touching them) whose file lives
	 * under a folder marked `hidden` in the given config. Path-prefix match
	 * on folder segments, so hiding a folder hides everything under it.
	 * Public so callers can report accurate counts for what toMarkdown()
	 * actually wrote, instead of the pre-filter totals.
	 */
	static excludeHiddenFolders(data: DiagramData, folders?: Record<string, FolderConfig>): DiagramData {
		if (!folders) return data;

		const hiddenFolders = Object.entries(folders)
			.filter(([, config]) => config.hidden)
			.map(([folderPath]) => folderPath);

		if (hiddenFolders.length === 0) return data;

		const isHidden = (filePath: string): boolean =>
			hiddenFolders.some(folder => filePath === folder || filePath.startsWith(`${folder}/`));

		const classes = data.classes.filter(cls => !isHidden(cls.filePath));
		const visibleIds = new Set(classes.map(cls => `${cls.filePath}__${cls.name}`));
		const relationships = data.relationships.filter(rel => visibleIds.has(rel.from) && visibleIds.has(rel.to));

		return { ...data, classes, relationships };
	}

	/**
	 * Generate a compact folder tree structure
	 */
	static generateFolderTree(data: DiagramData): string {
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
