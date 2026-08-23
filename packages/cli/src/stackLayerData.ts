import { DiagramFolderNode, FolderStructureBuilder, KrataiConfig, ReactFlowEdge, ReactFlowNode } from '@kratai/core';
import { foldSingleClassFolders, prefixFoldedClassName } from '@kratai/diagram-view';

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
	// Paths (opaque strings - see stackLayerView.ts's SELF_SUFFIX) with
	// hiddenInStack set in config, seeding the client's hiddenNodes on load
	// so a hide toggle from a previous session survives a restart.
	initialHidden: string[];
}

function collectLeafFolders(folder: DiagramFolderNode, leaves: DiagramFolderNode[]): void {
	if (folder.classes.length > 0) leaves.push(folder);
	folder.children.forEach(child => collectLeafFolders(child, leaves));
}

/**
 * Get custom order for a folder from config - mirrors
 * FolderBoxRenderer.getFolderOrder in @kratai/diagram-view exactly, so a
 * folder's position in the 3D stack always agrees with its position in the
 * class diagram (same config, same tiebreak rules).
 */
function getFolderOrder(path: string, config?: KrataiConfig): number | null {
	const folderConfig = config?.folders?.[path];
	if (folderConfig?.order !== undefined && folderConfig.order !== null) {
		return folderConfig.order;
	}
	return null;
}

/**
 * Builds the data the stack-layer view needs: one entry per leaf folder (a
 * folder that directly contains classes) - the exact same set the class
 * diagram renders as folder boxes - plus each class's method/param counts
 * (used in place of LOC - see stackLayerView.ts - to size that folder's
 * sheet), and cross-folder relationships for the beam lines connecting
 * sheets.
 *
 * Ordering is deliberately plain: custom config order first, then
 * alphabetical by path. An earlier version also tried a "smart" layer-
 * weight heuristic (guessing architectural depth from path/folder-name
 * patterns) as a middle tiebreak - dropped because everyone's mental model
 * of "what's a low layer vs a high layer" differs, so a guess was as often
 * wrong as right. Plain folder-structure order is at least predictable -
 * it's literally the order you already see in your file tree - and
 * stackLayerView.ts's drill-down tree makes that folder structure easy to
 * navigate directly instead of needing the sort to encode it.
 */
export function buildStackLayerData(workspaceName: string, nodes: ReactFlowNode[], edges: ReactFlowEdge[], config?: KrataiConfig): StackLayerData {
	const root = FolderStructureBuilder.build(nodes);
	const leaves: DiagramFolderNode[] = [];
	collectLeafFolders(root, leaves);

	// No filtering here beyond what FolderStructureBuilder already decided -
	// same leaf folders (including any synthetic route: pseudo-class bucket)
	// the class diagram renders as boxes, so the two views always agree on
	// what counts as a layer.
	const nonEmptyLeaves = leaves
		.map(f => ({ fullPath: f.fullPath, name: f.name, classes: f.classes }))
		.filter(f => f.classes.length > 0);

	// Same fold @kratai/diagram-view's FolderBoxRenderer applies: a leaf
	// folder with exactly one class is usually routing structure (Next.js's
	// app/auth/sign-in/page.tsx, app/auth/sign-up/page.tsx, ...), not a real
	// architectural grouping, so it folds into its parent as a class instead
	// of getting its own near-empty sheet.
	const folded = foldSingleClassFolders<ReactFlowNode, { fullPath: string; name: string; classes: ReactFlowNode[] }>(
		nonEmptyLeaves,
		(node, originFolderName) => ({
			...node,
			data: { ...node.data, classInfo: { ...node.data.classInfo, name: prefixFoldedClassName(node.data.classInfo.name, originFolderName) } }
		}),
		(fullPath, name, classes) => ({ fullPath, name, classes })
	);

	const folders: StackLayerFolder[] = folded
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
				path: f.fullPath,
				name: f.name,
				score,
				classes
			};
		})
		.sort((a, b) => {
			const orderA = getFolderOrder(a.path, config);
			const orderB = getFolderOrder(b.path, config);
			if (orderA !== null && orderB !== null) return orderA - orderB;
			if (orderA !== null) return -1;
			if (orderB !== null) return 1;
			return a.path.localeCompare(b.path);
		});

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

	const initialHidden = Object.entries(config?.folders || {})
		.filter(([, folderConfig]) => folderConfig.hiddenInStack)
		.map(([folderPath]) => folderPath);

	return { workspaceName, folders, relationships, initialHidden };
}
