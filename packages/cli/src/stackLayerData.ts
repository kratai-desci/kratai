import { DiagramFolderNode, FolderStructureBuilder, KrataiConfig, ReactFlowEdge, ReactFlowNode } from '@kratai/core';
import { getLayerWeight } from '@kratai/diagram-view';

export interface StackLayerClass {
	id: string;
	name: string;
	isInterface: boolean;
	isAbstract: boolean;
	methodCount: number;
	paramCount: number;
}

export interface StackLayerFolder {
	path: string;
	name: string;
	layerWeight: number;
	// Sum of every class's (methods + total params) in this folder - kratai
	// doesn't track per-class line counts, so this stands in for LOC as the
	// "how much code is actually here" signal that sizes the folder's sheet
	// (see stackLayerView.ts) and flags oversized layers.
	score: number;
	classes: StackLayerClass[];
}

export interface StackLayerRelationship {
	source: string;
	target: string;
	type: string;
	sourceFolder: string;
	targetFolder: string;
}

export interface StackLayerData {
	workspaceName: string;
	folders: StackLayerFolder[];
	relationships: StackLayerRelationship[];
	// Folder paths that should start expanded in the 3D stack, read from
	// config.folders[path].expanded (kratai.config.json/kratai.local.json) -
	// the same per-path config map the class diagram already reads `order`
	// from. Not restricted to leaf folders: an intermediate path like "app"
	// is valid too, matching how the client's expand/collapse tree works.
	initialExpanded: string[];
}

function collectLeafFolders(folder: DiagramFolderNode, leaves: DiagramFolderNode[]): void {
	if (folder.classes.length > 0) leaves.push(folder);
	folder.children.forEach(child => collectLeafFolders(child, leaves));
}

/**
 * Builds the data the stack-layer view needs: one entry per leaf folder
 * (a folder that directly contains classes), each class's method/param
 * counts (used in place of LOC - see stackLayerView.ts - to size that
 * folder's sheet), and cross-folder relationships for the beam lines
 * connecting sheets.
 */
export function buildStackLayerData(workspaceName: string, nodes: ReactFlowNode[], edges: ReactFlowEdge[], config?: KrataiConfig): StackLayerData {
	const root = FolderStructureBuilder.build(nodes);
	const leaves: DiagramFolderNode[] = [];
	collectLeafFolders(root, leaves);

	// Drop synthetic "virtual API route" pseudo-classes (id starts with a
	// route: pseudo-path) - these duplicate the real per-file route handlers
	// already present elsewhere in the tree, and would otherwise clutter an
	// unclassified root bucket.
	const nonEmptyLeaves = leaves
		.map(f => ({ path: f.fullPath, name: f.name, classes: f.classes.filter(n => !n.id.startsWith('route:')) }))
		.filter(f => f.classes.length > 0);

	const folders: StackLayerFolder[] = nonEmptyLeaves
		.map(f => {
			const classes = f.classes.map(n => {
				const info = n.data.classInfo;
				const methodCount = info.methods.length;
				const paramCount = info.methods.reduce((sum, m) => sum + m.parameters.length, 0);
				return {
					id: n.id,
					name: info.name,
					isInterface: !!info.isInterface,
					isAbstract: !!info.isAbstract,
					methodCount,
					paramCount
				};
			});
			const score = classes.reduce((sum, c) => sum + c.methodCount + c.paramCount, 0);
			return {
				path: f.path,
				name: f.name,
				layerWeight: getLayerWeight(f.path, f.name),
				score,
				classes
			};
		})
		.sort((a, b) => a.layerWeight - b.layerWeight);

	const classIdToFolder: Record<string, string> = {};
	folders.forEach(f => f.classes.forEach(c => { classIdToFolder[c.id] = f.path; }));

	const relationships: StackLayerRelationship[] = edges
		.map(e => ({
			source: e.source,
			target: e.target,
			type: e.label || 'uses',
			sourceFolder: classIdToFolder[e.source],
			targetFolder: classIdToFolder[e.target]
		}))
		.filter((r): r is StackLayerRelationship => !!r.sourceFolder && !!r.targetFolder);

	const initialExpanded = Object.entries(config?.folders || {})
		.filter(([, folderConfig]) => folderConfig?.expanded === true)
		.map(([path]) => path);

	return { workspaceName, folders, relationships, initialExpanded };
}
