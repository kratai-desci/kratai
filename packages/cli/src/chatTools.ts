import * as path from 'path';
import { DiagramData } from '@kratai/analysis';

const MAX_SEARCH_RESULTS = 15;

function formatRelType(type: string | string[]): string {
	// ClassRelationship.type is a single string most of the time, but can be
	// string[] after deduplication (see its own doc comment) - normalize
	// either shape to one display string.
	return Array.isArray(type) ? type.join('/') : type;
}

function searchClasses(diagramData: DiagramData, query: string): string {
	const q = query.toLowerCase();
	// Bare file-level 'module' entries (a file with no class/interface of
	// its own) are almost never what "search for a class" means and mostly
	// just clutter results with entries like "[index] (module)" - excluded
	// rather than merely deprioritized, since they were burning real tool
	// turns without ever being useful.
	const candidates = diagramData.classes.filter(c => c.classType !== 'module');
	const nameMatches = candidates.filter(c => c.name.toLowerCase().includes(q));
	const pathOnlyMatches = candidates.filter(c => !c.name.toLowerCase().includes(q) && c.filePath.toLowerCase().includes(q));
	const matches = [...nameMatches, ...pathOnlyMatches];
	if (matches.length === 0) return `No classes/files matched "${query}". Try get_folder_structure or a broader query.`;
	const shown = matches.slice(0, MAX_SEARCH_RESULTS);
	const lines = shown.map(c => `- ${c.name}${c.classType ? ` (${c.classType})` : ''} - ${c.filePath}`);
	if (matches.length > shown.length) lines.push(`... and ${matches.length - shown.length} more - narrow the query.`);
	return lines.join('\n');
}

function getClassDetail(diagramData: DiagramData, name: string): string {
	const cls = diagramData.classes.find(c => c.name === name)
		|| diagramData.classes.find(c => c.name.toLowerCase() === name.toLowerCase());
	if (!cls) return `No class/file named "${name}" found. Try search_classes first to get the exact name.`;

	const lines = [`${cls.name}${cls.classType ? ` (${cls.classType})` : ''} - ${cls.filePath}`];
	if (cls.routeMeta) lines.push(`Route: ${cls.routeMeta.method} ${cls.routeMeta.path}`);

	if (cls.properties.length > 0) {
		lines.push('Properties:');
		cls.properties.forEach(p => lines.push(`- ${p.visibility === 'private' ? '-' : '+'} ${p.name}: ${p.type}`));
	}
	if (cls.methods.length > 0) {
		lines.push('Methods:');
		cls.methods.forEach(m => {
			const params = m.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
			lines.push(`- ${m.visibility === 'private' ? '-' : '+'} ${m.name}(${params}): ${m.returnType}${m.isAsync ? ' [async]' : ''}`);
		});
	}

	const related = diagramData.relationships.filter(r => r.from === cls.name || r.to === cls.name);
	if (related.length > 0) {
		lines.push('Relationships:');
		related.slice(0, 25).forEach(r => lines.push(`- ${r.from} --${formatRelType(r.type)}--> ${r.to}`));
	}

	return lines.join('\n');
}

function traceReachability(diagramData: DiagramData, from: string, to: string): string {
	if (!diagramData.classes.some(c => c.name === from)) return `No class named "${from}" found.`;
	if (!diagramData.classes.some(c => c.name === to)) return `No class named "${to}" found.`;

	// Plain BFS over the relationship graph, forward direction only (from
	// depends on / reaches to) - matches "does A reach B", not "are they
	// related in either direction".
	const adjacency = new Map<string, string[]>();
	diagramData.relationships.forEach(r => {
		if (!adjacency.has(r.from)) adjacency.set(r.from, []);
		adjacency.get(r.from)!.push(r.to);
	});

	const queue: string[][] = [[from]];
	const visited = new Set<string>([from]);
	while (queue.length > 0) {
		const path = queue.shift()!;
		const last = path[path.length - 1];
		if (last === to) return `Path found: ${path.join(' -> ')}`;
		for (const next of adjacency.get(last) || []) {
			if (visited.has(next)) continue;
			visited.add(next);
			queue.push([...path, next]);
		}
	}
	return `No path found from "${from}" to "${to}" through the dependency graph.`;
}

function whatChanged(diagramData: DiagramData): string {
	const changed = diagramData.classes.filter(c => c.changeStatus && c.changeStatus !== 'unchanged');
	if (changed.length === 0) return 'No uncommitted changes detected.';
	return changed.map(c => `- ${c.changeStatus}: ${c.name} (${c.filePath})`).join('\n');
}

function getFolderStructure(diagramData: DiagramData): string {
	const folders = Array.from(new Set(
		diagramData.classes.map(c => path.dirname(c.filePath)).filter(f => f !== '.')
	)).sort();
	return folders.length > 0 ? folders.join('\n') : '(no folder structure detected)';
}

/**
 * The other half of chatToolDefinitions.ts's schemas (in @kratai/llm) -
 * split across packages because this is the only layer with access to a
 * codebase's actual parsed data. view.ts's chat loop calls this once per
 * tool the model asked for, feeding the string result straight back as a
 * ToolResult.output.
 */
export function executeChatTool(name: string, input: Record<string, unknown>, diagramData: DiagramData): string {
	switch (name) {
		case 'search_classes':
			return searchClasses(diagramData, String(input.query || ''));
		case 'get_class_detail':
			return getClassDetail(diagramData, String(input.name || ''));
		case 'trace_reachability':
			return traceReachability(diagramData, String(input.from || ''), String(input.to || ''));
		case 'what_changed':
			return whatChanged(diagramData);
		case 'get_folder_structure':
			return getFolderStructure(diagramData);
		default:
			return `Unknown tool: ${name}`;
	}
}
