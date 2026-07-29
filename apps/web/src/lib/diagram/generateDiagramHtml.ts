import 'server-only';

import type { ConfigFolderNode, DiagramData, KrataiConfig } from '@kratai/core';
import { DiagramGeneratorService } from '@kratai/core';
import { ClassDiagramView } from '@kratai/viewer';

import sampleDiagram from '../fixtures/sample-diagram.json';

// The only fixture available in this UI-only phase - every generated view
// renders this same real DiagramData regardless of which (mock) repo/branch
// was selected. Phase 2 replaces this with real
// CodeParserService.parseWorkspace output from a server-side clone.
const FIXTURE_DIAGRAM_DATA = sampleDiagram as DiagramData;

export function getFixtureDiagramData(): DiagramData {
	return FIXTURE_DIAGRAM_DATA;
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
 * panel, derived from what's actually present in the fixture data - mirrors
 * detectAvailableTypes/countRelationshipsByType in
 * apps/vsextension/src/commands/showConfigPanel.ts, just computed
 * synchronously since the fixture is already in memory instead of a fresh
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

export function getAvailableExtensions(data: DiagramData): FilterOption[] {
	const filesByExt = new Map<string, Set<string>>();
	data.classes.forEach((c) => {
		const dot = c.filePath.lastIndexOf('.');
		const ext = dot === -1 ? '' : c.filePath.slice(dot);
		if (!filesByExt.has(ext)) filesByExt.set(ext, new Set());
		filesByExt.get(ext)!.add(c.filePath);
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
 * Folder tree for the config panel's folder-selection UI, derived from the
 * fixture's file paths (there's no real repo to scan from in this UI-only
 * phase). Mirrors ConfigFolderNode, the same shape
 * apps/vsextension/src/commands/showConfigPanel.ts's buildFolderTree
 * produces, and what CodeParserService.parseWorkspace's config.selectedFolders
 * expects in phase 2.
 */
export function buildFixtureFolderTree(config: KrataiConfig): ConfigFolderNode {
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

	for (const classInfo of FIXTURE_DIAGRAM_DATA.classes) {
		const dir = classInfo.filePath.includes('/')
			? classInfo.filePath.slice(0, classInfo.filePath.lastIndexOf('/'))
			: '';
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
