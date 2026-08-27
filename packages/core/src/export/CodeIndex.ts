import { DiagramData } from '../types/domain';
import { MarkdownExporter } from './MarkdownExporter';

/**
 * On-demand code navigation for an agent, as an alternative to the full
 * upfront dump MarkdownExporter.toMarkdown() produces: a cheap names-only
 * outline, a search over class/file names, and a single-class or
 * single-file detail lookup - so an agent can traverse the codebase by
 * asking targeted questions instead of reading everything or grepping
 * blindly. Every method here always operates on the full, unfiltered
 * DiagramData - the `hidden`-folder curation MarkdownExporter.toMarkdown()
 * respects is about what's worth showing in an unprompted summary; these
 * are answers to a specific question the agent asked, so there's nothing
 * to hide from it.
 */
export class CodeIndex {
	/**
	 * Folder tree plus, per file, just the names of its classes/properties/
	 * methods - no types, no signatures, no relationships. Cheap enough to
	 * show unconditionally; anything beyond a name is a `getDetail()` call
	 * away once the agent knows what it's looking for.
	 */
	static buildOutline(data: DiagramData): string {
		let md = `## Project Structure\n\n`;
		md += MarkdownExporter.generateFolderTree(data);
		md += `\n\n---\n\n## Classes by file\n\n`;

		const byFile = new Map<string, typeof data.classes>();
		for (const cls of data.classes) {
			if (!byFile.has(cls.filePath)) byFile.set(cls.filePath, []);
			byFile.get(cls.filePath)!.push(cls);
		}

		for (const filePath of [...byFile.keys()].sort()) {
			md += `${filePath}\n`;
			for (const cls of byFile.get(filePath)!) {
				const type = cls.classType && cls.classType !== 'class' ? ` (${cls.classType})` : '';
				const props = (cls.properties ?? []).map(p => p.name);
				const methods = (cls.methods ?? []).map(m => `${m.name}()`);
				const members = [...props, ...methods].join(', ');
				md += `  - ${cls.name}${type}${members ? `: ${members}` : ''}\n`;
			}
		}

		return md;
	}

	/**
	 * Case-insensitive substring match over class names and file paths.
	 * Returns matches, not a guess at the single "right" one - getDetail()
	 * handles disambiguation for an exact lookup.
	 */
	static search(data: DiagramData, query: string): string {
		const q = query.toLowerCase();

		const classMatches = data.classes
			.filter(cls => cls.name.toLowerCase().includes(q))
			.map(cls => `  - ${cls.name} (${cls.filePath})`);

		const filePaths = [...new Set(data.classes.map(cls => cls.filePath))]
			.filter(fp => fp.toLowerCase().includes(q))
			.sort();

		if (classMatches.length === 0 && filePaths.length === 0) {
			return `No classes or files matching "${query}".\n`;
		}

		let md = '';
		if (classMatches.length > 0) {
			md += `Classes matching "${query}":\n${classMatches.join('\n')}\n\n`;
		}
		if (filePaths.length > 0) {
			md += `Files matching "${query}":\n${filePaths.map(fp => `  - ${fp}`).join('\n')}\n`;
		}
		return md;
	}

	/**
	 * Full detail (properties, methods, relationships) for one class or
	 * every class in one file. Accepts, in order:
	 *  - "path/to/file.ext::ClassName" - unambiguous, always resolves directly
	 *  - an exact file path - returns every class declared in that file
	 *  - a bare class name - resolves directly if unique; if it matches
	 *    more than one class, returns the candidate list (with qualified
	 *    "file::name" forms) instead of guessing which one was meant
	 */
	static getDetail(data: DiagramData, identifier: string): string {
		const { usesMap, usedByMap } = MarkdownExporter.buildRelationshipMaps(data);

		if (identifier.includes('::')) {
			const [filePath, className] = identifier.split('::');
			const match = data.classes.find(cls => cls.filePath === filePath && cls.name === className);
			if (!match) return `No class "${className}" found in "${filePath}".\n`;
			return MarkdownExporter.formatClassBlock(match, usesMap, usedByMap);
		}

		const fileMatches = data.classes.filter(cls => cls.filePath === identifier);
		if (fileMatches.length > 0) {
			return fileMatches.map(cls => MarkdownExporter.formatClassBlock(cls, usesMap, usedByMap)).join('');
		}

		const classMatches = data.classes.filter(cls => cls.name.toLowerCase() === identifier.toLowerCase());
		if (classMatches.length === 1) {
			return MarkdownExporter.formatClassBlock(classMatches[0], usesMap, usedByMap);
		}
		if (classMatches.length > 1) {
			const candidates = classMatches.map(cls => `  - ${cls.filePath}::${cls.name}`).join('\n');
			return `"${identifier}" matches ${classMatches.length} classes - re-run with one of these:\n${candidates}\n`;
		}

		return `No class or file matching "${identifier}". Try \`search\` first.\n`;
	}
}
