import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { WorkspaceScanner } from '../services/parsing/workspaceScanner';
import { ConfigService } from '../services/util/configService';
import { CodeParserService } from '../services/parsing/codeParserService';
import { KrataiConfig } from '../types/config';
import { ViewManager } from '../services/view';

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

function getTypeLabel(type: string): string {
	const labels: { [key: string]: string } = {
		'class': '📦 Classes',
		'interface': '🔌 Interfaces',
		'abstract': '🎨 Abstract Classes',
		'module': '📄 Modules',
		'enum': '🔢 Enums'
	};
	return labels[type] || `📋 ${type.charAt(0).toUpperCase() + type.slice(1)}`;
}

function getRelTypeLabel(type: string): string {
	const labels: { [key: string]: string } = {
		// Core OOP
		'extends': '🔵 Extends',
		'implements': '🟣 Implements',
		'composition': '🔴 Composition',
		'uses': '⚪ Uses',
		// Method calls
		'calls': '📞 Calls',
		'calls-super': '⬆️ Calls Super',
		'calls-static': '🔷 Calls Static',
		'async-calls': '⚡ Async Calls',
		// Type relationships
		'parameter': '📝 Parameter',
		'returns': '↩️ Returns',
		'creates': '🏭 Creates',
		// Module graph
		'imports': '📦 Imports',
		're-exports': '🔄 Re-exports',
		// HTTP
		'http-call': '📡 HTTP Call',
		'routes-to': '🔗 Routes To',
		// ORM
		'belongs-to': '🗄️ Belongs To',
		'many-to-many': '🔗 Many-to-Many',
		'one-to-one': '⚡ One-to-One',
		// Templates & Views
		'renders': '🎨 Renders',
		'serializes': '📦 Serializes',
		'protected-by': '🛡️ Protected By',
		// Framework-specific
		'middleware': '🔐 Middleware',
		'layout-wraps': '🧱 Layout Wraps',
		'server-action': '⚡ Server Action'
	};
	return labels[type] || `🔗 ${type.charAt(0).toUpperCase() + type.slice(1)}`;
}

function getRelTypeDescription(type: string): string {
	const descriptions: { [key: string]: string } = {
		// Core OOP
		'extends': 'Class inheritance',
		'implements': 'Interface implementation',
		'composition': 'Property type relationships',
		'uses': 'Dependencies and imports',
		// Method calls
		'calls': 'Method/function calls',
		'calls-super': 'super() method calls',
		'calls-static': 'Static method calls',
		'async-calls': 'Async function calls',
		// Type relationships
		'parameter': 'Function parameter types',
		'returns': 'Function return types',
		'creates': 'Object creation (new)',
		// Module graph
		'imports': 'Module imports',
		're-exports': 'Module re-exports',
		// HTTP
		'http-call': 'fetch() calls to API endpoints',
		'routes-to': 'URL pattern → Handler',
		// ORM
		'belongs-to': 'ForeignKey, one-to-many',
		'many-to-many': 'M2M field relationships',
		'one-to-one': '1-to-1 field relationships',
		// Templates & Views
		'renders': 'View → Template',
		'serializes': 'DRF Serializer → Model',
		'protected-by': 'Middleware → Protected route',
		// Framework-specific
		'middleware': 'Next.js middleware protection',
		'layout-wraps': 'Next.js layout → Nested page',
		'server-action': 'Next.js form → Server action'
	};
	return descriptions[type] || '';
}

/**
 * Build folder tree for UI display
 * Helper function for config panel - builds tree structure from file system
 */
function buildFolderTree(workspacePath: string, selectedFolders: string[]): import('../types/view').ConfigFolderNode {
	const DEFAULT_EXCLUSIONS = [
		'node_modules', 'dist', 'build', 'out', '.git', '.vscode',
		'venv', '.venv', 'env', '__pycache__', 'site-packages', '.tox', '.pytest_cache',
		'vendor',
		'.idea', '.DS_Store', 'coverage', '.next', '.nuxt'
	];

	const rootNode: import('../types/view').ConfigFolderNode = {
		path: '',
		name: path.basename(workspacePath),
		selected: selectedFolders.length === 0,
		children: []
	};

	function buildTreeRecursive(
		relativePath: string,
		node: import('../types/view').ConfigFolderNode
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

			const childNode: import('../types/view').ConfigFolderNode = {
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

	panel.webview.html = generateConfigHTML(folderTree, extensions, config, availableTypes, availableRelTypes, diagramName, mode, relationshipCounts);

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

function generateConfigHTML(folderTree: any, extensions: any[], config: any, availableTypes: string[], availableRelTypes: string[], diagramName: string, mode: string, relationshipCounts?: Record<string, number>): string {
	const infoMessage = mode === 'edit'
		? `<div class="info-box">
			✏️ <strong>Editing diagram settings</strong><br/>
			📁 Adjust folders, filters, and file types below.
		</div>`
		: `<div class="info-box">
			➕ <strong>Creating new diagram</strong><br/>
			📁 Root folder selected by default. Adjust folders and file types below.
		</div>`;

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kratai Configuration</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .header h2 {
            margin: 0;
            color: var(--vscode-textLink-foreground);
        }
        .header-actions {
            display: flex;
            gap: 10px;
        }
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            background: transparent;
            border: none;
            color: var(--vscode-foreground);
            font-size: 14px;
        }
        .tab.active {
            border-bottom: 2px solid var(--vscode-textLink-foreground);
            color: var(--vscode-textLink-foreground);
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .folder-scroll-container {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .folder-tree {
            margin-left: 20px;
        }
        .folder-item {
            display: flex;
            align-items: center;
            padding: 4px 0;
            gap: 8px;
        }
        .folder-toggle {
            cursor: pointer;
            user-select: none;
            width: 16px;
            text-align: center;
            font-size: 12px;
        }
        .folder-toggle:hover {
            color: var(--vscode-textLink-foreground);
        }
        .folder-item input[type="checkbox"] {
            cursor: pointer;
        }
        .folder-item input[type="checkbox"]:indeterminate {
            opacity: 0.6;
        }
        .folder-item input[type="checkbox"]:indeterminate::before {
            content: '';
            display: block;
            width: 8px;
            height: 2px;
            background: currentColor;
            position: relative;
            top: 5px;
            left: 2px;
        }
        .folder-item label {
            cursor: pointer;
            user-select: none;
        }
        .folder-children {
            display: block;
        }
        .folder-children.collapsed {
            display: none;
        }
        .extension-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .extension-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
        }
        .extension-item input[type="checkbox"] {
            cursor: pointer;
        }
        .extension-count {
            margin-left: auto;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        
        .name-input-container {
            margin-bottom: 20px;
            padding: 15px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
        }
        
        .name-input-container label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
        }
        
        .name-input-container input[type="text"] {
            width: 100%;
            padding: 8px 12px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-size: 14px;
            box-sizing: border-box;
        }
        
        .name-input-container input[type="text"]:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }

        button {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        button.secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        button.danger {
            background: #d32f2f;
            color: white;
            font-weight: 600;
        }
        button.danger:hover {
            background: #b71c1c;
        }
        .danger-zone {
            background: rgba(211, 47, 47, 0.1);
            border: 1px solid rgba(211, 47, 47, 0.3);
            border-radius: 4px;
            padding: 20px;
            margin-top: 20px;
        }
        .danger-zone h3 {
            color: #d32f2f;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .danger-zone-warning {
            background: rgba(255, 193, 7, 0.1);
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 15px 0;
            font-size: 13px;
        }
        .info-box {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 12px;
            margin-bottom: 20px;
            font-size: 13px;
        }
        .success-box {
            background: rgba(16, 124, 16, 0.15);
            border-left: 4px solid #4caf50;
            padding: 12px;
            margin-bottom: 20px;
            font-size: 13px;
            line-height: 1.6;
        }
        
        /* Folder Order Tab Styles */
        .folder-order-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 15px;
        }
        
        .folder-order-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
            border: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .folder-order-item.dragging {
            opacity: 0.5;
            cursor: grabbing;
        }
        
        .folder-order-item.drag-over {
            border-color: var(--vscode-textLink-foreground);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .drag-handle {
            cursor: grab;
            user-select: none;
            font-size: 16px;
            color: var(--vscode-descriptionForeground);
            padding: 4px;
        }
        
        .drag-handle:hover {
            color: var(--vscode-textLink-foreground);
        }
        
        .drag-handle:active {
            cursor: grabbing;
        }
        
        .folder-order-checkbox {
            cursor: pointer;
        }
        
        .folder-order-name {
            flex: 1;
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
        }
        
        .folder-order-number {
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
            font-size: 12px;
            min-width: 30px;
            text-align: center;
        }
        
        .folder-order-buttons {
            display: flex;
            gap: 4px;
        }
        
        .folder-order-buttons button {
            padding: 4px 8px;
            font-size: 12px;
            min-width: 28px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .folder-order-buttons button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        
        .folder-order-buttons button:not(:disabled):hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .folder-order-empty {
            text-align: center;
            padding: 40px 20px;
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        
        .folder-order-reset {
            margin-top: 15px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>⚙️ ${mode === 'edit' ? 'Edit Diagram' : 'Create New Diagram'}</h2>
        <div class="header-actions">
            <button onclick="saveConfig(false)" class="secondary">💾 Save Only</button>
            <button onclick="saveConfig(true)">💾 Save & Generate Diagram</button>
        </div>
    </div>
    
    ${infoMessage}
    
    <div class="name-input-container">
        <label for="diagram-name">📝 Diagram Name</label>
        <input type="text" id="diagram-name" value="${diagramName}" maxlength="50" 
               placeholder="e.g., API Routes, Domain Model">
    </div>
    
    <div class="info-box">
        📌 Select which folders and file types to include in the class diagram.
        Default exclusions: node_modules, dist, build, out, .git
    </div>

    <div class="tabs">
        <button class="tab active" onclick="switchTab('folders')">📁 Folders</button>
        <button class="tab" onclick="switchTab('extensions')">📄 File Types</button>
        <button class="tab" onclick="switchTab('filters')">🔍 Display Filters</button>
        <button class="tab" onclick="switchTab('folderOrder')">📊 Folder Order</button>
        ${mode === 'edit' ? `<button class="tab" onclick="switchTab('danger')">⚠️ Danger Zone</button>` : ''}
    </div>

    <div id="folders-tab" class="tab-content active">
        <h3>Select Folders to Parse</h3>
        <div class="folder-scroll-container">
            <div class="folder-tree">
                ${renderFolderTree(folderTree)}
            </div>
        </div>
    </div>

    <div id="extensions-tab" class="tab-content">
        <h3>Select File Extensions</h3>
        <div class="extension-list">
            ${extensions.map(ext => `
                <div class="extension-item">
                    <input type="checkbox" id="ext-${ext.extension.replace('.', '')}" 
                           value="${ext.extension}" ${ext.selected ? 'checked' : ''}>
                    <label for="ext-${ext.extension.replace('.', '')}">${ext.extension}</label>
                    <span class="extension-count">${ext.count} files</span>
                </div>
            `).join('')}
        </div>
    </div>

    <div id="filters-tab" class="tab-content">
        <h3>Display Filters</h3>
        
        <div style="margin-bottom: 30px;">
            <h4 style="margin-bottom: 10px;">Class Types to Show</h4>
            <div class="extension-list">
                ${availableTypes.map(type => {
                    const isChecked = config.classTypeFilters?.[type] !== false;
                    return `
                        <div class="extension-item">
                            <input type="checkbox" id="filter-${type}" data-type="${type}" ${isChecked ? 'checked' : ''}>
                            <label for="filter-${type}">${getTypeLabel(type)}</label>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div style="margin-bottom: 30px;">
            <h4 style="margin-bottom: 10px;">Git Diff Visualization</h4>
            <div class="extension-list">
                <div class="extension-item">
                    <input type="checkbox" id="git-diff-enabled" ${config.gitDiff?.enabled !== false ? 'checked' : ''}>
                    <label for="git-diff-enabled">🔍 Show Git Changes</label>
                </div>
                <div style="margin-left: 30px; margin-top: 10px; font-size: 12px; color: var(--vscode-descriptionForeground);">
                    <div style="margin-bottom: 5px;">🟢 Green = Added files/members</div>
                    <div style="margin-bottom: 5px;">🔴 Red = Deleted files/members</div>
                    <div>🟡 Yellow = Modified members</div>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 30px;">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
				<h4 style="margin: 0;">Relationships to Show</h4>
				<div style="display: flex; gap: 10px;">
					<button onclick="selectAllRels()" style="
						padding: 4px 12px;
						font-size: 12px;
						background: var(--vscode-button-secondaryBackground);
						color: var(--vscode-button-secondaryForeground);
						border: none;
						border-radius: 3px;
						cursor: pointer;
					">Select All</button>
					<button onclick="clearAllRels()" style="
						padding: 4px 12px;
						font-size: 12px;
						background: var(--vscode-button-secondaryBackground);
						color: var(--vscode-button-secondaryForeground);
						border: none;
						border-radius: 3px;
						cursor: pointer;
					">Clear All</button>
				</div>
			</div>
			<table style="
				width: 100%;
				border-collapse: collapse;
				margin-top: 10px;
				background: var(--vscode-editor-background);
				border: 1px solid var(--vscode-panel-border);
			">
				<thead>
					<tr style="background: var(--vscode-editorWidget-background);">
						<th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--vscode-panel-border); width: 25%;">Type</th>
						<th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--vscode-panel-border); width: 50%;">Description</th>
						${mode === 'edit' ? '<th style="padding: 8px; text-align: center; border-bottom: 1px solid var(--vscode-panel-border); width: 10%;">Count</th>' : ''}
						<th style="padding: 8px; text-align: center; border-bottom: 1px solid var(--vscode-panel-border); width: ${mode === 'edit' ? '15%' : '25%'};">Show</th>
					</tr>
				</thead>
				<tbody>
					${availableRelTypes.map((type, index) => {
						const isChecked = config.relationshipTypeFilters?.[type] !== false;
						const count = relationshipCounts?.[type] || 0;
						// Add visual separators between categories
						const addSeparator = index === 4 || index === 8 || index === 11 || index === 13 || index === 15 || index === 18 || index === 21;
						return `
							${addSeparator ? `<tr style="height: 10px; background: transparent;"><td colspan="${mode === 'edit' ? '4' : '3'}"></td></tr>` : ''}
							<tr style="border-bottom: 1px solid var(--vscode-panel-border);">
								<td style="padding: 8px;">${getRelTypeLabel(type)}</td>
								<td style="padding: 8px; color: var(--vscode-descriptionForeground);">${getRelTypeDescription(type)}</td>
								${mode === 'edit' ? `<td style="padding: 8px; text-align: center; font-weight: 600; color: ${count > 0 ? 'var(--vscode-textLink-foreground)' : 'var(--vscode-descriptionForeground)'};">${count}</td>` : ''}
								<td style="padding: 8px; text-align: center;">
									<input type="checkbox" id="rel-${type}" data-reltype="${type}" ${isChecked ? 'checked' : ''} style="cursor: pointer;">
								</td>
							</tr>
						`;
					}).join('')}
				</tbody>
			</table>
		</div>
    </div>

    <div id="folderOrder-tab" class="tab-content">
        <h3>Folder Display Order</h3>
        
        <div class="info-box">
            📊 Customize the order in which folders appear in the diagram. Drag folders to reorder, or use arrow buttons for precise control.<br><br>
            💡 <strong>Smart Defaults:</strong> Folders without custom order use intelligent layer-based sorting (API → Middleware → Controllers → Services → Models → Templates → Utils → Tests).
        </div>
        
        <div id="folder-order-container">
            <!-- Populated by JavaScript -->
        </div>
        
        <button onclick="resetFolderOrder()" class="folder-order-reset">↻ Reset to Smart Defaults</button>
    </div>

    ${mode === 'edit' ? `
    <div id="danger-tab" class="tab-content">
        <div class="danger-zone">
            <h3>⚠️ Delete This Diagram</h3>
            
            <div class="danger-zone-warning">
                ⚠️ <strong>Warning:</strong> This action cannot be undone. The diagram configuration will be permanently deleted.
            </div>
            
            <p style="margin-bottom: 20px;">
                Deleting this diagram will:
            </p>
            <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li>Remove the diagram from the sidebar</li>
                <li>Delete the configuration file</li>
                <li>This action is permanent and cannot be reversed</li>
            </ul>
            
            <button onclick="deleteDiagram()" class="danger">🗑️ Delete This Diagram</button>
        </div>
    </div>
    ` : ''}

    <script>
        console.log('='.repeat(80));
        console.log('🚀 SCRIPT BLOCK STARTED - Timestamp:', new Date().toISOString());
        console.log('='.repeat(80));
        
        let vscode;
        try {
            vscode = acquireVsCodeApi();
            console.log('✅ VS Code API acquired successfully');
        } catch (error) {
            console.error('❌ Failed to acquire VS Code API:', error);
        }
        
        // Smart default layer weights (same as folderBoxRenderer.ts)
        const LAYER_WEIGHTS = {
            "api": 100, "apis": 100,
            // HTTP Methods (for virtual API boxes)
            "get": 100, "post": 100, "put": 100, "patch": 100, "delete": 100,
            "head": 100, "options": 100,
            // WebSocket/Events
            "websocket": 100, "ws": 100, "webhook": 100, "webhooks": 100,
            // API-related
            "endpoints": 105, "endpoint": 105, "graphql": 110, "mutation": 110, "subscription": 110,
            "middleware": 200, "middlewares": 200, "interceptors": 205, "interceptor": 205,
            "guards": 210, "guard": 210, "filters": 215, "filter": 215,
            "routes": 300, "route": 300, "routing": 300, "urls": 305, "url": 305,
            "controllers": 400, "controller": 400, "handlers": 405, "handler": 405,
            "views": 400, "view": 400, "pages": 400, "page": 400,
            "screens": 400, "screen": 400,
            "services": 500, "service": 500, "usecases": 505, "use-cases": 505, "usecase": 505,
            "business": 510, "domain": 515, "domains": 515, "core": 520,
            "providers": 520, "provider": 520, "store": 520, "stores": 520,
            "commands": 525, "command": 525, "actions": 525, "action": 525,
            "reducers": 528, "reducer": 528, "queries": 530, "query": 530,
            "processors": 535, "processor": 535, "workflows": 540, "workflow": 540,
            "config": 600, "configuration": 600, "settings": 605,
            "utils": 610, "util": 610, "utilities": 610, "helpers": 615, "helper": 615,
            "hooks": 618, "hook": 618,
            "common": 620, "shared": 625, "lib": 630, "libs": 630, "library": 630,
            "types": 635, "type": 635, "interfaces": 640, "interface": 640,
            "constants": 645, "constant": 645, "enums": 650, "enum": 650,
            "adapters": 655, "adapter": 655, "clients": 660, "client": 660,
            "external": 665, "integrations": 670, "integration": 670,
            "features": 675, "feature": 675, "modules": 680, "module": 680,
            "repositories": 700, "repository": 700, "repos": 700, "repo": 700,
            "dal": 705, "dataaccess": 705, "data-access": 705, "persistence": 710,
            "models": 800, "model": 800, "dto": 805, "dtos": 805,
            "entities": 805, "entity": 805, "schemas": 808, "schema": 808,
            "database": 810, "db": 810, "storage": 815, "data": 820,
            "templates": 900, "template": 900, "layouts": 900, "layout": 900,
            "presenters": 905, "presenter": 905,
            "serializers": 910, "serializer": 910, "responses": 915, "response": 915,
            "formatters": 920, "formatter": 920,
            "components": 925, "component": 925, "ui": 925,
            "tests": 990, "test": 990, "__tests__": 990, "specs": 992, "spec": 992,
            "__specs__": 992, "e2e": 994, "unit": 996,
            "docs": 998, "documentation": 998, "examples": 999, "example": 999
        };
        
        /**
         * Get smart layer weight for a folder
         * Virtual boxes (API routes) float to top, others use layer-based weights
         */
        function getSmartLayerWeight(fullPath) {
            const folderName = fullPath.split('/').pop() || '';
            
            // Check if this is a virtual box
            if (isVirtualBox(fullPath, folderName)) {
                return 0; // Float to top
            }
            
            // Regular folders: analyze both path and name, take the better (lower) weight
            const pathWeight = analyzeForKeywords(fullPath);
            const nameWeight = analyzeForKeywords(folderName);
            
            return Math.min(pathWeight, nameWeight);
        }
        
        /**
         * Check if this is a virtual box (API routes, webhooks, etc.)
         */
        function isVirtualBox(fullPath, folderName) {
            console.log('[isVirtualBox] Called with:', {fullPath, folderName});
            
            // Empty or blank = virtual
            if (!fullPath || fullPath.trim() === '') {
                console.log('[isVirtualBox] Empty path, returning true');
                return true;
            }
            
            // Check for specific API route patterns
            const virtualPatterns = [
                /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\\s/i,  // HTTP methods
                /^API\\s+\\//i,                                      // "API /" prefix
                /:\\.\\.\\.\\(all\\|any\\)/i                                // Dynamic route params
            ];
            
            const result = virtualPatterns.some(pattern => pattern.test(fullPath));
            console.log('[isVirtualBox] Result:', result);
            return result;
        }
        
        /**
         * Analyze a string (path or name) for layer keywords
         */
        function analyzeForKeywords(text) {
            // Split by / and spaces, normalize each token
            const tokens = text.toLowerCase()
                .split(/[\/\s]+/)
                .map(t => t.replace(/[-_]/g, ''));
            
            let bestMatch = null;
            let bestLength = 0;
            
            // Check each token for exact match or contains match
            for (const token of tokens) {
                // 1. Check exact match
                if (LAYER_WEIGHTS[token] !== undefined) {
                    const weight = LAYER_WEIGHTS[token];
                    if (bestMatch === null || weight < bestMatch) {
                        bestMatch = weight;
                        bestLength = token.length;
                    }
                    continue;
                }
                
                // 2. Check if token contains any known keyword (longest match wins)
                for (const [keyword, weight] of Object.entries(LAYER_WEIGHTS)) {
                    if (token.includes(keyword) && keyword.length > bestLength) {
                        if (bestMatch === null || weight < bestMatch) {
                            bestMatch = weight;
                            bestLength = keyword.length;
                        }
                    }
                }
            }
            
            // Default weight for unknown
            return bestMatch !== null ? bestMatch : 9999;
        }
        
        // Store folder order state
        let folderOrderData = [];
        
        console.log('[INIT] Starting folder order initialization');
        
        // Initialize folder order data from saved config (if available)
        const initialFolderConfig = ${JSON.stringify(config.folders || {})};
        
        console.log('[INIT] initialFolderConfig:', initialFolderConfig);
        console.log('[INIT] initialFolderConfig keys:', Object.keys(initialFolderConfig));
        
        // Load initial folder order from config
        if (Object.keys(initialFolderConfig).length > 0) {
            // Convert folder config to array and sort by order
            const foldersArray = Object.entries(initialFolderConfig)
                .filter(([path, cfg]) => cfg.selected)
                .map(([path, cfg]) => ({
                    path: path,
                    selected: cfg.selected,
                    order: cfg.order
                }));
            
            // Sort by order (custom order first, then smart defaults, then alphabetical)
            foldersArray.sort((a, b) => {
                // Custom order takes precedence
                if (a.order !== null && b.order !== null) {
                    return a.order - b.order;
                }
                if (a.order !== null) return -1;
                if (b.order !== null) return 1;
                
                // Both have null order - use smart layer weights
                const weightA = getSmartLayerWeight(a.path);
                const weightB = getSmartLayerWeight(b.path);
                
                if (weightA !== weightB) {
                    return weightA - weightB;
                }
                
                // Alphabetical tiebreaker
                return a.path.localeCompare(b.path);
            });
            
            // Renumber to ensure sequential ordering
            foldersArray.forEach((folder, idx) => {
                if (folder.order !== null) {
                    folder.order = idx + 1;
                }
            });
            
            folderOrderData = foldersArray;
            console.log('[INIT] Loaded folderOrderData from config:', folderOrderData);
            console.log('[INIT] folderOrderData.length:', folderOrderData.length);
        } else {
            console.log('[INIT] No initial folder config, folderOrderData is empty');
        }

        function deleteDiagram() {
            vscode.postMessage({
                command: 'delete',
                diagramName: document.getElementById('diagram-name').value.trim()
            });
        }

        function switchTab(tabName) {
            console.log('[switchTab] Called with tabName:', tabName);
            
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // Find and activate the correct tab button
            let foundTab = false;
            document.querySelectorAll('.tab').forEach(tab => {
                const onclick = tab.getAttribute('onclick');
                if (onclick && onclick.includes("'" + tabName + "'")) {
                    tab.classList.add('active');
                    foundTab = true;
                    console.log('[switchTab] Activated tab button:', tab.textContent);
                }
            });
            
            if (!foundTab) {
                console.warn('[switchTab] Could not find tab button for:', tabName);
            }
            
            const tabContent = document.getElementById(tabName + '-tab');
            if (tabContent) {
                tabContent.classList.add('active');
                console.log('[switchTab] Activated tab content:', tabName + '-tab');
            } else {
                console.error('[switchTab] Tab content not found:', tabName + '-tab');
            }
            
            // Initialize folder order list when switching to that tab
            if (tabName === 'folderOrder') {
                console.log('[switchTab] Calling initializeFolderOrder()');
                initializeFolderOrder();
            }
        }

        /**
         * Initialize folder order list from current folder selections
         */
        function initializeFolderOrder() {
            console.log('[initializeFolderOrder] START');
            console.log('[initializeFolderOrder] Current folderOrderData before:', folderOrderData);
            
            // Get all selected folders from the folders tab
            const selectedFolders = [];
            
            // Check if folders-tab exists
            const foldersTab = document.getElementById('folders-tab');
            console.log('[initializeFolderOrder] folders-tab exists?', !!foldersTab);
            if (foldersTab) {
                console.log('[initializeFolderOrder] folders-tab display:', window.getComputedStyle(foldersTab).display);
            }
            
            const allCheckboxes = document.querySelectorAll('#folders-tab .folder-item input[type="checkbox"]');
            console.log('[initializeFolderOrder] Found checkboxes:', allCheckboxes.length);
            console.log('[initializeFolderOrder] Selector used:', '#folders-tab .folder-item input[type="checkbox"]');
            
            allCheckboxes.forEach(cb => {
                console.log('[Folder Order] Checkbox:', {
                    id: cb.id,
                    value: cb.value,
                    checked: cb.checked,
                    indeterminate: cb.indeterminate
                });
                
                if (cb.checked && !cb.indeterminate && cb.value) {
                    selectedFolders.push(cb.value);
                }
            });
            
            console.log('[Folder Order] Selected folders:', selectedFolders);
            
            // Sort by smart layer weights (not alphabetically)
            selectedFolders.sort((a, b) => {
                const weightA = getSmartLayerWeight(a);
                const weightB = getSmartLayerWeight(b);
                
                if (weightA !== weightB) {
                    return weightA - weightB;
                }
                
                return a.localeCompare(b);
            });
            
            // Initialize folder order data with sequential order numbers
            folderOrderData = selectedFolders.map((folder, index) => ({
                path: folder,
                selected: true,
                order: index + 1
            }));
            
            console.log('[Folder Order] Final folderOrderData:', folderOrderData);
            
            renderFolderOrderList();
        }

        /**
         * Render the folder order list UI
         */
        function renderFolderOrderList() {
            console.log('[renderFolderOrderList] START');
            console.log('[renderFolderOrderList] folderOrderData:', folderOrderData);
            console.log('[renderFolderOrderList] folderOrderData.length:', folderOrderData.length);
            
            const container = document.getElementById('folder-order-container');
            console.log('[renderFolderOrderList] Container exists?', !!container);
            
            if (!container) {
                console.error('[renderFolderOrderList] Container not found!');
                return;
            }
            
            if (folderOrderData.length === 0) {
                console.log('[renderFolderOrderList] No folders, showing empty message');
                container.innerHTML = '<div class="folder-order-empty">No folders selected. Go to the Folders tab to select folders.</div>';
                return;
            }
            
            const html = '<div class="folder-order-list">' + 
                folderOrderData.map((folder, index) => {
                    const isFirst = index === 0;
                    const isLast = index === folderOrderData.length - 1;
                    
                    return \`
                        <div class="folder-order-item" 
                             draggable="true" 
                             data-index="\${index}"
                             ondragstart="handleDragStart(event)"
                             ondragover="handleDragOver(event)"
                             ondrop="handleDrop(event)"
                             ondragend="handleDragEnd(event)"
                             ondragleave="handleDragLeave(event)">
                            <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                            <input type="checkbox" 
                                   class="folder-order-checkbox" 
                                   checked 
                                   disabled 
                                   title="Folder is selected">
                            <span class="folder-order-name">\${folder.path}</span>
                            <span class="folder-order-number">#\${folder.order}</span>
                            <div class="folder-order-buttons">
                                <button onclick="moveFolderUp(\${index})" 
                                        \${isFirst ? 'disabled' : ''} 
                                        title="Move up">↑</button>
                                <button onclick="moveFolderDown(\${index})" 
                                        \${isLast ? 'disabled' : ''} 
                                        title="Move down">↓</button>
                            </div>
                        </div>
                    \`;
                }).join('') + 
                '</div>';
            
            console.log('[renderFolderOrderList] Generated HTML length:', html.length);
            console.log('[renderFolderOrderList] HTML preview:', html.substring(0, 500));
            container.innerHTML = html;
            console.log('[renderFolderOrderList] HTML set to container');
            console.log('[renderFolderOrderList] Container children count:', container.children.length);
        }

        /**
         * Move folder up in the order
         */
        function moveFolderUp(index) {
            if (index === 0) return;
            
            // Swap with previous item
            const temp = folderOrderData[index];
            folderOrderData[index] = folderOrderData[index - 1];
            folderOrderData[index - 1] = temp;
            
            // Renumber
            folderOrderData.forEach((folder, idx) => {
                folder.order = idx + 1;
            });
            
            renderFolderOrderList();
        }

        /**
         * Move folder down in the order
         */
        function moveFolderDown(index) {
            if (index === folderOrderData.length - 1) return;
            
            // Swap with next item
            const temp = folderOrderData[index];
            folderOrderData[index] = folderOrderData[index + 1];
            folderOrderData[index + 1] = temp;
            
            // Renumber
            folderOrderData.forEach((folder, idx) => {
                folder.order = idx + 1;
            });
            
            renderFolderOrderList();
        }

        /**
         * Reset folder order to smart defaults (set all orders to null)
         * Folders will be sorted by layer weights (API → Middleware → Controllers → Services, etc.)
         */
        function resetFolderOrder() {
            // Set all orders to null (will use smart layer-based defaults)
            folderOrderData.forEach(folder => {
                folder.order = null;
            });
            
            // Sort by smart defaults (same logic as diagram rendering)
            folderOrderData.sort((a, b) => {
                const weightA = getSmartLayerWeight(a.path);
                const weightB = getSmartLayerWeight(b.path);
                
                if (weightA !== weightB) {
                    return weightA - weightB;
                }
                
                // Alphabetical tiebreaker
                return a.path.localeCompare(b.path);
            });
            
            renderFolderOrderList();
        }

        // ===== Drag and Drop Handlers =====
        
        let draggedIndex = null;

        /**
         * Handle drag start event
         */
        function handleDragStart(event) {
            draggedIndex = parseInt(event.currentTarget.getAttribute('data-index'));
            event.currentTarget.classList.add('dragging');
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/html', event.currentTarget.innerHTML);
        }

        /**
         * Handle drag over event (allows dropping)
         */
        function handleDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            
            const targetElement = event.currentTarget;
            if (targetElement.classList.contains('folder-order-item') && 
                !targetElement.classList.contains('dragging')) {
                targetElement.classList.add('drag-over');
            }
            
            return false;
        }

        /**
         * Handle drag leave event
         */
        function handleDragLeave(event) {
            event.currentTarget.classList.remove('drag-over');
        }

        /**
         * Handle drop event
         */
        function handleDrop(event) {
            event.stopPropagation();
            event.preventDefault();
            
            const targetIndex = parseInt(event.currentTarget.getAttribute('data-index'));
            
            if (draggedIndex !== null && draggedIndex !== targetIndex) {
                // Remove item from old position
                const draggedItem = folderOrderData[draggedIndex];
                folderOrderData.splice(draggedIndex, 1);
                
                // Insert at new position
                const newIndex = draggedIndex < targetIndex ? targetIndex : targetIndex;
                folderOrderData.splice(newIndex, 0, draggedItem);
                
                // Renumber all items
                folderOrderData.forEach((folder, idx) => {
                    folder.order = idx + 1;
                });
                
                renderFolderOrderList();
            }
            
            return false;
        }

        /**
         * Handle drag end event (cleanup)
         */
        function handleDragEnd(event) {
            // Remove all drag-related classes
            document.querySelectorAll('.folder-order-item').forEach(item => {
                item.classList.remove('dragging');
                item.classList.remove('drag-over');
            });
            
            draggedIndex = null;
        }

        function toggleFolderExpand(element) {
            const children = element.parentElement.nextElementSibling;
            if (children && children.classList.contains('folder-children')) {
                children.classList.toggle('collapsed');
                element.textContent = children.classList.contains('collapsed') ? '▶' : '▼';
            }
        }

        function toggleFolder(checkbox, path) {
            // Smart cascading: parent changes cascade to children
            const folderItem = checkbox.closest('.folder-item');
            const nextSibling = folderItem.nextElementSibling;
            
            // 1. Cascade parent state to all children
            if (nextSibling && nextSibling.classList.contains('folder-children')) {
                const childCheckboxes = nextSibling.querySelectorAll('input[type="checkbox"]');
                childCheckboxes.forEach(cb => {
                    cb.checked = checkbox.checked;
                    cb.indeterminate = false;
                });
            }
            
            // 2. Update parent states up the tree
            updateParentStates(folderItem);
        }
        
        /**
         * Update parent checkbox states based on children
         * Sets parent to: checked (all children checked), unchecked (no children checked), 
         * or indeterminate (some children checked)
         */
        function updateParentStates(startingItem) {
            let currentItem = startingItem;
            
            // Walk up the tree
            while (currentItem) {
                // Find parent by going up: folder-children -> folder-item
                const parentChildren = currentItem.parentElement;
                if (!parentChildren || !parentChildren.classList.contains('folder-children')) {
                    break;
                }
                
                const parentItem = parentChildren.previousElementSibling;
                if (!parentItem || !parentItem.classList.contains('folder-item')) {
                    break;
                }
                
                const parentCheckbox = parentItem.querySelector('input[type="checkbox"]');
                if (!parentCheckbox) {
                    break;
                }
                
                // Count checked children
                const childCheckboxes = parentChildren.querySelectorAll('.folder-item > input[type="checkbox"]');
                let checkedCount = 0;
                let totalCount = 0;
                
                childCheckboxes.forEach(cb => {
                    totalCount++;
                    if (cb.checked && !cb.indeterminate) {
                        checkedCount++;
                    } else if (cb.indeterminate) {
                        checkedCount += 0.5; // Indeterminate counts as partial
                    }
                });
                
                // Update parent state
                if (checkedCount === 0) {
                    parentCheckbox.checked = false;
                    parentCheckbox.indeterminate = false;
                } else if (checkedCount === totalCount) {
                    parentCheckbox.checked = true;
                    parentCheckbox.indeterminate = false;
                } else {
                    parentCheckbox.checked = false;
                    parentCheckbox.indeterminate = true;
                }
                
                // Move up to parent
                currentItem = parentItem;
            }
        }

        function selectAllRels() {
            document.querySelectorAll('#filters-tab input[data-reltype]').forEach(cb => {
                cb.checked = true;
            });
        }

        function clearAllRels() {
            document.querySelectorAll('#filters-tab input[data-reltype]').forEach(cb => {
                cb.checked = false;
            });
        }

        // Initialize checkbox event listeners
        console.log('[DOM] Setting up event listeners and initialization');
        console.log('[DOM] document.readyState:', document.readyState);
        
        function initializeCheckboxListeners() {
            console.log('[DOM] initializeCheckboxListeners() called');
            const allCheckboxes = document.querySelectorAll('.folder-item input[type="checkbox"]');
            console.log('[DOM] Found', allCheckboxes.length, 'checkboxes to initialize');
            
            allCheckboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    toggleFolder(cb, cb.value);
                });
            });
            
            // Initialize parent states based on loaded config
            // Process from deepest to shallowest to ensure correct state
            const allFolderItems = Array.from(document.querySelectorAll('.folder-item'));
            console.log('[DOM] Found', allFolderItems.length, 'folder items');
            
            // Reverse to process children before parents
            allFolderItems.reverse().forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    const folderChildren = item.nextElementSibling;
                    if (folderChildren && folderChildren.classList.contains('folder-children')) {
                        // This is a parent - update its state based on children
                        updateParentStates(item);
                    }
                }
            });
            
            console.log('[DOM] Checkbox initialization complete');
        }
        
        // Run immediately if DOM is already loaded, otherwise wait for DOMContentLoaded
        if (document.readyState === 'loading') {
            console.log('[DOM] DOM still loading, waiting for DOMContentLoaded event');
            document.addEventListener('DOMContentLoaded', initializeCheckboxListeners);
        } else {
            console.log('[DOM] DOM already loaded, initializing immediately');
            initializeCheckboxListeners();
        }

        function saveConfig(generateDiagram) {
            // Get diagram name from input
            const diagramName = document.getElementById('diagram-name').value.trim();
            
            if (!diagramName) {
                alert('Please enter a diagram name');
                return;
            }
            
            const selectedFolders = [];
            // Only include fully checked folders (not indeterminate)
            document.querySelectorAll('#folders-tab .folder-item input[type="checkbox"]').forEach(cb => {
                if (cb.checked && !cb.indeterminate && cb.value) {
                    selectedFolders.push(cb.value);
                }
            });

            const selectedExtensions = [];
            document.querySelectorAll('.extension-item input[type="checkbox"]:checked').forEach(cb => {
                selectedExtensions.push(cb.value);
            });

            // Collect class type filters dynamically
            const classTypeFilters = {};
            document.querySelectorAll('#filters-tab input[data-type]').forEach(cb => {
                const type = cb.getAttribute('data-type');
                classTypeFilters[type] = cb.checked;
            });

            // Collect relationship type filters dynamically
            const relationshipTypeFilters = {};
            document.querySelectorAll('#filters-tab input[data-reltype]').forEach(cb => {
                const type = cb.getAttribute('data-reltype');
                relationshipTypeFilters[type] = cb.checked;
            });

            // Collect git diff settings
            const gitDiffEnabled = document.getElementById('git-diff-enabled').checked;
            
            console.log('[saveConfig] selectedFolders from checkboxes:', selectedFolders);
            console.log('[saveConfig] folderOrderData:', folderOrderData);
            
            // Build folders record with order information
            const folders = {};
            
            // ALWAYS use selectedFolders (current UI state) as source of truth
            // Use folderOrderData only for ORDER information, not for selection state
            selectedFolders.forEach(folderPath => {
                // Check if this folder has custom order in folderOrderData
                const existingOrder = folderOrderData.find(f => f.path === folderPath);
                
                folders[folderPath] = {
                    selected: true,
                    expanded: true,
                    order: existingOrder ? existingOrder.order : null  // Preserve order if exists, otherwise null
                };
            });
            
            console.log('[saveConfig] Built folders object:', folders);
            console.log('[saveConfig] Folder count:', Object.keys(folders).length);

            vscode.postMessage({
                command: 'save',
                diagramName: diagramName,
                selectedFolders,  // Keep for backwards compatibility
                folders,  // NEW: folder config with order
                selectedExtensions,
                classTypeFilters,
                relationshipTypeFilters,
                gitDiff: {
                    enabled: gitDiffEnabled,
                    baseCommit: 'HEAD~1'
                },
                generateDiagram
            });
        }
    </script>
</body>
</html>`;
}

function renderFolderTree(node: any, level: number = 0): string {
	const hasChildren = node.children && node.children.length > 0;
	
	// Check if this node or any descendants are selected
	const shouldExpand = hasSelectedDescendants(node);
	const toggleIcon = hasChildren ? (shouldExpand ? '▼' : '▶') : ' ';
	const indent = level * 20;
	
	let html = `
		<div class="folder-item" style="margin-left: ${indent}px">
			<span class="folder-toggle" onclick="toggleFolderExpand(this)">${toggleIcon}</span>
			<input type="checkbox" id="folder-${node.path || 'root'}" 
			       value="${node.path}" ${node.selected ? 'checked' : ''}>
			<label for="folder-${node.path || 'root'}">📁 ${node.name}</label>
		</div>
	`;

	if (hasChildren) {
		// Collapse by default unless this branch has selected folders
		const collapsedClass = shouldExpand ? '' : ' collapsed';
		html += `<div class="folder-children${collapsedClass}">`;
		for (const child of node.children) {
			html += renderFolderTree(child, level + 1);
		}
		html += `</div>`;
	}

	return html;
}

/**
 * Check if node or any of its descendants are selected
 */
function hasSelectedDescendants(node: any): boolean {
	if (node.selected) {
		return true;
	}
	
	if (node.children && node.children.length > 0) {
		return node.children.some((child: any) => hasSelectedDescendants(child));
	}
	
	return false;
}
