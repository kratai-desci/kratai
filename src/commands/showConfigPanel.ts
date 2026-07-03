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
	const folderTree = WorkspaceScanner.scanFolders(workspacePath, config.selectedFolders);
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

	// Create webview panel
	const panel = vscode.window.createWebviewPanel(
		'krataiConfig',
		mode === 'edit' ? '⚙️ Edit Diagram' : '⚙️ Create New Diagram',
		vscode.ViewColumn.One,
		{
			enableScripts: true
		}
	);

	panel.webview.html = generateConfigHTML(folderTree, extensions, config, availableTypes, availableRelTypes, diagramName, mode);

	// Handle messages from webview
	panel.webview.onDidReceiveMessage(
		async message => {
			switch (message.command) {
				case 'save':
					const finalDiagramName = message.diagramName || diagramName;
					
					const newConfig: KrataiConfig = {
						selectedFolders: message.selectedFolders,
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

function generateConfigHTML(folderTree: any, extensions: any[], config: any, availableTypes: string[], availableRelTypes: string[], diagramName: string, mode: string): string {
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
						<th style="padding: 8px; text-align: left; border-bottom: 1px solid var(--vscode-panel-border); width: 60%;">Description</th>
						<th style="padding: 8px; text-align: center; border-bottom: 1px solid var(--vscode-panel-border); width: 15%;">Show</th>
					</tr>
				</thead>
				<tbody>
					${availableRelTypes.map((type, index) => {
						const isChecked = config.relationshipTypeFilters?.[type] !== false;
						// Add visual separators between categories
						const addSeparator = index === 4 || index === 8 || index === 11 || index === 13 || index === 15 || index === 18 || index === 21;
						return `
							${addSeparator ? '<tr style="height: 10px; background: transparent;"><td colspan="3"></td></tr>' : ''}
							<tr style="border-bottom: 1px solid var(--vscode-panel-border);">
								<td style="padding: 8px;">${getRelTypeLabel(type)}</td>
								<td style="padding: 8px; color: var(--vscode-descriptionForeground);">${getRelTypeDescription(type)}</td>
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
        const vscode = acquireVsCodeApi();

        function deleteDiagram() {
            vscode.postMessage({
                command: 'delete',
                diagramName: document.getElementById('diagram-name').value.trim()
            });
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
        }

        function toggleFolderExpand(element) {
            const children = element.parentElement.nextElementSibling;
            if (children && children.classList.contains('folder-children')) {
                children.classList.toggle('collapsed');
                element.textContent = children.classList.contains('collapsed') ? '▶' : '▼';
            }
        }

        function toggleFolder(checkbox, path) {
            // Toggle all children checkboxes when parent is toggled
            const folderItem = checkbox.closest('.folder-item');
            const nextSibling = folderItem.nextElementSibling;
            
            if (nextSibling && nextSibling.classList.contains('folder-children')) {
                const childCheckboxes = nextSibling.querySelectorAll('input[type="checkbox"]');
                childCheckboxes.forEach(cb => {
                    cb.checked = checkbox.checked;
                    cb.indeterminate = false;
                });
            }
            
            // Checkboxes are now independent - no automatic parent updates
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
        document.addEventListener('DOMContentLoaded', () => {
            const allCheckboxes = document.querySelectorAll('.folder-item input[type="checkbox"]');
            allCheckboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    toggleFolder(cb, cb.value);
                });
            });
        });

        function saveConfig(generateDiagram) {
            // Get diagram name from input
            const diagramName = document.getElementById('diagram-name').value.trim();
            
            if (!diagramName) {
                alert('Please enter a diagram name');
                return;
            }
            
            const selectedFolders = [];
            // Only include fully checked folders (not indeterminate)
            document.querySelectorAll('.folder-item input[type="checkbox"]').forEach(cb => {
                if (cb.checked && !cb.indeterminate) {
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

            vscode.postMessage({
                command: 'save',
                diagramName: diagramName,
                selectedFolders,
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
	const toggleIcon = hasChildren ? '▼' : ' '; // Changed to ▼ (expanded by default)
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
		// Add 'expanded' class by default (removed - now default is expanded)
		html += `<div class="folder-children">`;
		for (const child of node.children) {
			html += renderFolderTree(child, level + 1);
		}
		html += `</div>`;
	}

	return html;
}
