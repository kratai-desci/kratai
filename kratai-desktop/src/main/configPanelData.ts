import * as fs from 'fs';
import * as path from 'path';
import { CodeParserService, ConfigFolderNode, KrataiConfig } from '@kratai/core';

// Mirrors apps/vsextension/src/commands/showConfigPanel.ts's data-gathering
// helpers - kept as a separate small duplicate rather than a shared export
// since these call fs/@kratai/core directly and aren't view-rendering logic
// (ConfigPanelView itself is a local copy in this directory, see configPanelView.ts).

export async function detectAvailableTypes(workspacePath: string): Promise<string[]> {
	try {
		const diagramData = await CodeParserService.parseWorkspace(workspacePath);
		const typeSet = new Set<string>();

		diagramData.classes.forEach(classInfo => {
			const type = classInfo.classType || 'class';
			typeSet.add(type);
		});

		const coreTypes = ['class', 'interface', 'abstract', 'module'];
		const detectedTypes = Array.from(typeSet);
		const allTypes = [...new Set([...coreTypes, ...detectedTypes])];

		const typeOrder = ['class', 'interface', 'abstract', 'module', 'enum'];
		return typeOrder.filter(t => allTypes.includes(t));
	} catch (error) {
		console.error('Error detecting types:', error);
		return ['class', 'interface', 'abstract', 'module'];
	}
}

export async function countRelationshipsByType(workspacePath: string, config: KrataiConfig): Promise<Record<string, number>> {
	try {
		const diagramData = await CodeParserService.parseWorkspace(workspacePath, config);
		const counts: Record<string, number> = {};

		diagramData.relationships.forEach(rel => {
			const types = Array.isArray(rel.type) ? rel.type : [rel.type];
			types.forEach(type => {
				counts[type] = (counts[type] || 0) + 1;
			});
		});

		return counts;
	} catch (error) {
		console.error('Error counting relationships:', error);
		return {};
	}
}

export function buildFolderTree(workspacePath: string, selectedFolders: string[]): ConfigFolderNode {
	const DEFAULT_EXCLUSIONS = [
		'node_modules', 'dist', 'build', 'out', '.git', '.vscode',
		'venv', '.venv', 'env', '__pycache__', 'site-packages', '.tox', '.pytest_cache',
		'vendor',
		'.idea', '.DS_Store', 'coverage', '.next', '.nuxt'
	];

	const rootNode: ConfigFolderNode = {
		path: '',
		name: path.basename(workspacePath),
		selected: selectedFolders.length === 0,
		children: []
	};

	function buildTreeRecursive(relativePath: string, node: ConfigFolderNode): void {
		const fullPath = path.join(workspacePath, relativePath);

		if (!fs.existsSync(fullPath)) {
			return;
		}

		const entries = fs.readdirSync(fullPath, { withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			if (DEFAULT_EXCLUSIONS.includes(entry.name)) continue;

			const childRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
			const isSelected = selectedFolders.length === 0 || selectedFolders.includes(childRelativePath);

			const childNode: ConfigFolderNode = {
				path: childRelativePath,
				name: entry.name,
				selected: isSelected,
				children: []
			};

			buildTreeRecursive(childRelativePath, childNode);
			node.children.push(childNode);
		}
	}

	buildTreeRecursive('', rootNode);
	return rootNode;
}

export const AVAILABLE_REL_TYPES = [
	// Core OOP
	'extends', 'implements', 'composition', 'uses',
	// Method calls
	'calls', 'calls-super', 'calls-static', 'async-calls',
	// Type relationships
	'parameter', 'returns', 'creates',
	// Module graph
	'imports', 're-exports',
	// HTTP
	'http-call', 'routes-to',
	// ORM
	'belongs-to', 'many-to-many', 'one-to-one',
	// Templates & Views
	'renders', 'serializes', 'protected-by',
	// Framework-specific
	'middleware', 'layout-wraps', 'server-action'
];
