import * as vscode from 'vscode';
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

		return [];
	}
}
