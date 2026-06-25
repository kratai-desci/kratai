import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ViewManager } from '../services/view';

export class KrataiTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly commandId: string,
		public readonly iconName: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
		public readonly contextValue?: string,
		public readonly viewId?: string
	) {
		super(label, collapsibleState);
		
		if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
			this.command = {
				command: commandId,
				title: label,
				arguments: viewId ? [viewId] : []
			};
		}
		
		this.iconPath = new vscode.ThemeIcon(iconName);
	}
}

export class KrataiTreeProvider implements vscode.TreeDataProvider<KrataiTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<KrataiTreeItem | undefined | null | void> = 
		new vscode.EventEmitter<KrataiTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<KrataiTreeItem | undefined | null | void> = 
		this._onDidChangeTreeData.event;

	private workspacePath: string | undefined;

	constructor() {
		// Get workspace path
		if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
			this.workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
			
			// Watch exports folder for changes
			const exportsPattern = new vscode.RelativePattern(
				this.workspacePath,
				'.kratai/exports/**/*.md'
			);
			const watcher = vscode.workspace.createFileSystemWatcher(exportsPattern);
			
			// Refresh tree when files are created, changed, or deleted
			watcher.onDidCreate(() => this.refresh());
			watcher.onDidDelete(() => this.refresh());
		}
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: KrataiTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: KrataiTreeItem): Promise<KrataiTreeItem[]> {
		if (!element) {
			// Root level items
			return [
				new KrataiTreeItem(
					'Create New Diagram',
					'kratai.showConfigPanel',
					'add',
					vscode.TreeItemCollapsibleState.None
				),
				new KrataiTreeItem(
					'My Diagrams',
					'',
					'files',
					vscode.TreeItemCollapsibleState.Expanded,
					'diagramsGroup'
				),
				new KrataiTreeItem(
					'Exported Files',
					'',
					'archive',
					vscode.TreeItemCollapsibleState.Expanded,
					'exportsGroup'
				),
				new KrataiTreeItem(
					'Show Git Changes',
					'kratai.openGitChanges',
					'git-compare',
					vscode.TreeItemCollapsibleState.None
				),
				new KrataiTreeItem(
					'Community & Feedback',
					'kratai.openCommunity',
					'comment-discussion',
					vscode.TreeItemCollapsibleState.None
				)
			];
		}

		// Child items for "My Diagrams"
		if (element.contextValue === 'diagramsGroup') {
			if (!this.workspacePath) {
				return [];
			}

			try {
				const views = await ViewManager.listViews(this.workspacePath);
				
				if (views.length === 0) {
					// Show helper message when no diagrams exist
					const emptyItem = new KrataiTreeItem(
						'No diagrams yet',
						'',
						'info',
						vscode.TreeItemCollapsibleState.None
					);
					emptyItem.tooltip = 'Click "Create New Diagram" to get started';
					return [emptyItem];
				}

				return views.map(view => {
					const item = new KrataiTreeItem(
						view.name,
						'kratai.generateDiagramFromView',
						'graph',
						vscode.TreeItemCollapsibleState.None,
						'diagramView',
						view.id
					);
					
					// Add tooltip with metadata
					const lastGen = view.lastGenerated 
						? new Date(view.lastGenerated).toLocaleString()
						: 'Never';
					item.tooltip = `Last generated: ${lastGen}\\nClick to generate`;
					
					return item;
				});
			} catch (error) {
				console.error('Error loading diagram views:', error);
				return [];
			}
		}

		// Child items for "Exported Files"
		if (element.contextValue === 'exportsGroup') {
			if (!this.workspacePath) {
				return [];
			}

			try {
				const exportsDir = path.join(this.workspacePath, '.kratai', 'exports');
				
				// Check if exports directory exists
				if (!fs.existsSync(exportsDir)) {
					const emptyItem = new KrataiTreeItem(
						'No exports yet',
						'',
						'info',
						vscode.TreeItemCollapsibleState.None
					);
					emptyItem.tooltip = 'Export diagrams to see them here';
					return [emptyItem];
				}

				// Read all .md files in exports directory
				const files = fs.readdirSync(exportsDir)
					.filter(file => file.endsWith('.md'))
					.sort((a, b) => {
						// Sort by modification time, newest first
						const statA = fs.statSync(path.join(exportsDir, a));
						const statB = fs.statSync(path.join(exportsDir, b));
						return statB.mtime.getTime() - statA.mtime.getTime();
					});

				if (files.length === 0) {
					const emptyItem = new KrataiTreeItem(
						'No exports yet',
						'',
						'info',
						vscode.TreeItemCollapsibleState.None
					);
					emptyItem.tooltip = 'Export diagrams to see them here';
					return [emptyItem];
				}

				return files.map(file => {
					const filePath = path.join(exportsDir, file);
					const item = new KrataiTreeItem(
						file,
						'kratai.openExportedFile',
						'file-text',
						vscode.TreeItemCollapsibleState.None,
						'exportedFile',
						filePath
					);
					
					// Add tooltip with file info
					const stats = fs.statSync(filePath);
					const modifiedDate = stats.mtime.toLocaleString();
					item.tooltip = `Modified: ${modifiedDate}\\nClick to open`;
					
					return item;
				});
			} catch (error) {
				console.error('Error loading exported files:', error);
				return [];
			}
		}

		return [];
	}
}
