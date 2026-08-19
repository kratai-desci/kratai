import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceScanner, ConfigService, CodeParserService, KrataiConfig, ViewManager, ConfigFolderNode } from '@kratai/core';
import { ConfigPanelView } from '../views/configPanelView';

interface ConfigPanelOptions {
	mode?: 'create' | 'edit';  // create new or edit existing
	viewName?: string;          // Diagram name for create mode
	viewId?: string;            // View ID for edit mode
}

async function detectAvailableTypes(workspacePath: string): Promise<string[]> {
	try {
		// Quick scan to detect available class types
		const diagramData = await CodeParserService.parseWorkspace(workspacePath);
		const typeSet = new Set<string>();

		diagramData.classes.forEach(classInfo => {
			const type = classInfo.classType || 'class';
			typeSet.add(type);
		});

		// Always show these 4 core types (even if not present in codebase)
		// Users may want to filter them out, so they should always be visible
		const coreTypes = ['class', 'interface', 'abstract', 'module'];
		const detectedTypes = Array.from(typeSet);

		// Merge core types with detected types, remove duplicates
		const allTypes = [...new Set([...coreTypes, ...detectedTypes])];

		// Return types in a consistent order
		const typeOrder = ['class', 'interface', 'abstract', 'module', 'enum'];
		return typeOrder.filter(t => allTypes.includes(t));
	} catch (error) {
		console.error('Error detecting types:', error);
		return ['class', 'interface', 'abstract', 'module']; // Fallback
	}
}

async function countRelationshipsByType(workspacePath: string, config: KrataiConfig): Promise<Record<string, number>> {
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

/**
 * Build folder tree for UI display
 * Helper function for config panel - builds tree structure from file system
 */
function buildFolderTree(workspacePath: string, selectedFolders: string[]): ConfigFolderNode {
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

	function buildTreeRecursive(
		relativePath: string,
		node: ConfigFolderNode
	): void {
		const fullPath = path.join(workspacePath, relativePath);

		if (!fs.existsSync(fullPath)) {
			return;
		}

		const entries = fs.readdirSync(fullPath, { withFileTypes: true });

		for (const entry of entries) {
			if (!entry.isDirectory()) continue;

			if (DEFAULT_EXCLUSIONS.includes(entry.name)) {
				continue;
			}

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

export async function showConfigPanel(context: vscode.ExtensionContext, options?: ConfigPanelOptions): Promise<void> {
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('No workspace folder is open!');
		return;
	}

	const workspaceFolder = vscode.workspace.workspaceFolders[0];
	const workspacePath = workspaceFolder.uri.fsPath;

	const mode = options?.mode || 'create';
	let diagramName: string;
	let viewId: string | undefined;
	let config: KrataiConfig;

	if (mode === 'edit' && options?.viewId) {
		// Edit existing diagram
		viewId = options.viewId;
		const view = await ViewManager.getView(workspacePath, viewId);

		if (!view) {
			vscode.window.showErrorMessage(`Diagram not found: ${viewId}`);
			return;
		}

		diagramName = view.name;
		config = await ViewManager.loadViewConfig(workspacePath, viewId);
	} else {
		// Create new diagram
		// Generate auto-incrementing diagram name if not provided
		diagramName = options?.viewName || '';
		if (!diagramName) {
			const views = await ViewManager.listViews(workspacePath);
			const diagramNumber = views.length + 1;
			diagramName = `diagram-${diagramNumber}`;
		}

		// Start with smart defaults (root folder selected)
		config = ConfigService.generateSmartDefaults(workspacePath);
	}

	// Scan workspace
	const selectedFolders = ConfigService.getSelectedFolders(config);
	const folderTree = buildFolderTree(workspacePath, selectedFolders);
	const extensions = WorkspaceScanner.scanExtensionCounts(workspacePath);

	// Update selection state from config
	extensions.forEach(ext => {
		ext.selected = config.selectedExtensions.includes(ext.extension);
	});

	// Detect available types in the codebase
	const availableTypes = await detectAvailableTypes(workspacePath);
	const availableRelTypes = [
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

	// Count relationships in edit mode
	let relationshipCounts: Record<string, number> = {};
	if (mode === 'edit') {
		relationshipCounts = await countRelationshipsByType(workspacePath, config);
	}

	// Create webview panel
	const panel = vscode.window.createWebviewPanel(
		'krataiConfig',
		mode === 'edit' ? '⚙️ Edit Diagram' : '⚙️ Create New Diagram',
		vscode.ViewColumn.One,
		{
			enableScripts: true
		}
	);

	panel.webview.html = ConfigPanelView.generate(folderTree, extensions, config, availableTypes, availableRelTypes, diagramName, mode, relationshipCounts);

	// Handle messages from webview
	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				case 'save':
					const finalDiagramName = message.diagramName || diagramName;

					const newConfig: KrataiConfig = {
						selectedFolders: message.selectedFolders,
						folders: message.folders,  // NEW: Save folder order data
						selectedExtensions: message.selectedExtensions,
						respectGitignore: config.respectGitignore,
						followSymlinks: config.followSymlinks,
						classTypeFilters: message.classTypeFilters,
						relationshipTypeFilters: message.relationshipTypeFilters,
						gitDiff: message.gitDiff
					};

					try {
						if (mode === 'edit' && viewId) {
							// Update existing diagram
							let finalViewId = viewId;

							// Check if name changed
							if (finalDiagramName !== diagramName) {
								const newViewId = ViewManager.slugify(finalDiagramName);
								// Check if new name conflicts with existing diagram
								const existingView = await ViewManager.getView(workspacePath, newViewId);
								if (existingView && existingView.id !== viewId) {
									vscode.window.showErrorMessage(`A diagram named "${finalDiagramName}" already exists`);
									return;
								}
							}

							// Save config to existing view (using current viewId)
							await ViewManager.saveViewConfig(workspacePath, viewId, newConfig);

							// If name changed, update the registry and rename config file
							if (finalDiagramName !== diagramName) {
								finalViewId = await ViewManager.updateView(workspacePath, viewId, { name: finalDiagramName });
							}

							// Always update workspace state with current config
							context.workspaceState.update('currentViewId', finalViewId);
							context.workspaceState.update('currentViewName', finalDiagramName);
							context.workspaceState.update('currentViewConfig', newConfig);

							vscode.window.showInformationMessage(`Diagram "${finalDiagramName}" updated!`);
						} else {
							// Create new view
							const newView = await ViewManager.createView(workspacePath, finalDiagramName, newConfig);

							// Store view context immediately (so Settings button works)
							context.workspaceState.update('currentViewId', newView.id);
							context.workspaceState.update('currentViewName', finalDiagramName);
							context.workspaceState.update('currentViewConfig', newConfig);

							vscode.window.showInformationMessage(`Diagram "${finalDiagramName}" created!`);
						}

						// Refresh sidebar
						await vscode.commands.executeCommand('kratai.refreshViews');

						// Optionally generate diagram immediately
						if (message.generateDiagram) {
							panel.dispose();
							const finalViewId = viewId || ViewManager.slugify(finalDiagramName);

							// Store view context for generation (already stored above for new views)
							if (mode === 'edit') {
								context.workspaceState.update('currentViewId', finalViewId);
								context.workspaceState.update('currentViewName', finalDiagramName);
								context.workspaceState.update('currentViewConfig', newConfig);
							}

							vscode.commands.executeCommand('kratai.generateClassDiagramDirect');
						}
					} catch (error) {
						vscode.window.showErrorMessage(`Error saving diagram: ${error}`);
					}
					break;

				case 'delete':
					if (mode === 'edit' && viewId) {
						try {
							const diagramName = message.diagramName || 'this diagram';
							const confirm = await vscode.window.showWarningMessage(
								`Are you sure you want to delete "${diagramName}"? This action cannot be undone.`,
								{ modal: true },
								'Delete',
								'Cancel'
							);

							if (confirm === 'Delete') {
								await ViewManager.deleteView(workspacePath, viewId);
								vscode.window.showInformationMessage(`Diagram "${diagramName}" deleted successfully`);
								panel.dispose();
								await vscode.commands.executeCommand('kratai.refreshViews');
							}
						} catch (error) {
							vscode.window.showErrorMessage(`Error deleting diagram: ${error}`);
						}
					}
					break;
			}
		},
		undefined,
		context.subscriptions
	);
}
