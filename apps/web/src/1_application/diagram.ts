import 'server-only';

import type { ConfigFolderNode, DiagramData, KrataiConfig } from '@kratai/core';
import { DiagramGeneratorService } from '@kratai/core';
import { ClassDiagramView } from '@kratai/viewer';

import { getDiagramSource } from '@/3_infrastructure/diagramSource';

/**
 * Fetches the parsed architecture data for a repo/branch/config, discarding
 * the commit sha the data was generated from - for callers that only need
 * the data itself (building the configure page's folder tree/filter
 * options). Callers that need to persist a cache entry (generateView.ts)
 * call getDiagramSource() directly instead, since they need the commitSha
 * too. Thin pass-through to 3_infrastructure's diagramSource composition
 * point (an allowed application -> infrastructure call) - kept here so
 * presentation code only ever depends on 1_application, never reaches into
 * 3_infrastructure directly. Real repo (git clone + parse) when signed in,
 * the static fixture otherwise.
 */
export async function getDiagramData(
	repoFullName: string,
	branch: string,
	config: KrataiConfig
): Promise<DiagramData> {
	const source = await getDiagramSource();
	const { diagramData } = await source.getDiagramData(repoFullName, branch, config);
	return diagramData;
}

/**
 * File paths only, no parsing - what the configure page uses to build the
 * folder tree/extension picker before a diagram has ever been generated
 * for this view. Orders of magnitude cheaper than getDiagramData, since
 * neither of those widgets ever needed class/relationship data. See
 * DiagramSourceRepository.listFiles.
 */
export async function listRepoFiles(
	repoFullName: string,
	branch: string,
	config: KrataiConfig
): Promise<string[]> {
	const source = await getDiagramSource();
	return source.listFiles(repoFullName, branch, config);
}

/**
 * Mirrors the class-type / relationship-type filtering in
 * apps/vsextension/src/commands/generateClassDiagram.ts's
 * generateClassDiagramDirect, so the config panel's filters actually
 * affect what's rendered here too.
 */
export function applyConfigFilters(data: DiagramData, config: KrataiConfig): DiagramData {
	const classTypeFilters = config.classTypeFilters ?? {};
	const hasClassFilters = Object.keys(classTypeFilters).length > 0;

	let classes = data.classes;
	if (hasClassFilters) {
		classes = classes.filter((c) => classTypeFilters[c.classType || 'class'] !== false);
	}

	const relationshipTypeFilters = config.relationshipTypeFilters ?? {};
	const hasRelFilters = Object.keys(relationshipTypeFilters).length > 0;

	let relationships = data.relationships;
	if (hasRelFilters) {
		relationships = relationships.filter((rel) => {
			const types = Array.isArray(rel.type) ? rel.type : [rel.type as string];
			return types.some((type) => relationshipTypeFilters[type] === true);
		});
	}

	const validIds = new Set(classes.map((c) => `${c.filePath}__${c.name}`));
	relationships = relationships.filter((rel) => validIds.has(rel.from) && validIds.has(rel.to));

	return { classes, relationships };
}

/**
 * Available class-type / relationship-type filter options for the config
 * panel, derived from what's actually present in the data - mirrors
 * detectAvailableTypes/countRelationshipsByType in
 * apps/vsextension/src/commands/showConfigPanel.ts, just computed
 * synchronously since the data is already in memory instead of a fresh
 * parse.
 */
export interface FilterOption {
	type: string;
	count: number;
}

export function getAvailableClassTypes(data: DiagramData): FilterOption[] {
	const counts = new Map<string, number>();
	data.classes.forEach((c) => {
		const type = c.classType || 'class';
		counts.set(type, (counts.get(type) ?? 0) + 1);
	});

	// Always show these core types even if absent, same as the extension.
	const coreTypes = ['class', 'interface', 'abstract', 'module'];
	const allTypes = new Set([...coreTypes, ...counts.keys()]);
	const typeOrder = ['class', 'interface', 'abstract', 'module', 'enum'];
	const ordered = [
		...typeOrder.filter((t) => allTypes.has(t)),
		...[...allTypes].filter((t) => !typeOrder.includes(t)),
	];

	return ordered.map((type) => ({ type, count: counts.get(type) ?? 0 }));
}

const KNOWN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.php', '.html'];

/** Takes file paths directly (not DiagramData) - extension counts never needed parsed class data, only which files exist. */
export function getAvailableExtensions(files: string[]): FilterOption[] {
	const filesByExt = new Map<string, Set<string>>();
	files.forEach((filePath) => {
		const dot = filePath.lastIndexOf('.');
		const ext = dot === -1 ? '' : filePath.slice(dot);
		if (!filesByExt.has(ext)) filesByExt.set(ext, new Set());
		filesByExt.get(ext)!.add(filePath);
	});

	const allExts = new Set([...KNOWN_EXTENSIONS, ...filesByExt.keys()]);
	return [...allExts].map((ext) => ({ type: ext, count: filesByExt.get(ext)?.size ?? 0 }));
}

export function getAvailableRelationshipTypes(data: DiagramData): FilterOption[] {
	const counts = new Map<string, number>();
	data.relationships.forEach((rel) => {
		const types = Array.isArray(rel.type) ? rel.type : [rel.type as string];
		types.forEach((type) => counts.set(type, (counts.get(type) ?? 0) + 1));
	});

	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([type, count]) => ({ type, count }));
}

/**
 * Folder tree for the config panel's folder-selection UI, derived from a
 * plain file-path list (today: the fixture's paths, or listRepoFiles'
 * cheap scan; a cached view's diagramData works too, since ClassInfo.filePath
 * is all this ever read). Mirrors ConfigFolderNode, the same shape
 * apps/vsextension/src/commands/showConfigPanel.ts's buildFolderTree
 * produces, and what CodeParserService.parseWorkspace's
 * config.selectedFolders expects. fileCount is a file count (not a class
 * count) - a file with zero or several classes only ever counts once here.
 */
export function buildFolderTree(files: string[], config: KrataiConfig): ConfigFolderNode {
	const selectedFolders = config.selectedFolders ?? [];
	const isSelected = (folderPath: string) =>
		selectedFolders.length === 0 || selectedFolders.includes(folderPath);

	const root: ConfigFolderNode = { path: '', name: '/', selected: isSelected(''), children: [], fileCount: 0 };
	const nodesByPath = new Map<string, ConfigFolderNode>([['', root]]);

	function getOrCreate(folderPath: string): ConfigFolderNode {
		const existing = nodesByPath.get(folderPath);
		if (existing) return existing;

		const lastSlash = folderPath.lastIndexOf('/');
		const parentPath = lastSlash === -1 ? '' : folderPath.slice(0, lastSlash);
		const name = lastSlash === -1 ? folderPath : folderPath.slice(lastSlash + 1);
		const parent = getOrCreate(parentPath);

		const node: ConfigFolderNode = { path: folderPath, name, selected: isSelected(folderPath), children: [], fileCount: 0 };
		parent.children.push(node);
		nodesByPath.set(folderPath, node);
		return node;
	}

	for (const filePath of files) {
		const dir = filePath.includes('/') ? filePath.slice(0, filePath.lastIndexOf('/')) : '';
		const node = getOrCreate(dir);
		node.fileCount = (node.fileCount ?? 0) + 1;
	}

	return root;
}

export interface GeneratedDiagram {
	html: string;
	classCount: number;
	relationshipCount: number;
	folderCount: number;
}

export function generateDiagramHtml(
	diagramData: DiagramData,
	name: string,
	config: KrataiConfig
): GeneratedDiagram {
	const { nodes, edges } = DiagramGeneratorService.generateReactFlowData(diagramData);
	const html = ClassDiagramView.generate(nodes, edges, name, config);

	return {
		html,
		classCount: diagramData.classes.length,
		relationshipCount: diagramData.relationships.length,
		folderCount: nodes.filter((n) => n.type === 'folder').length,
	};
}
