import * as vscode from 'vscode';

export class KrataiTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly commandId: string,
		public readonly iconName: string
	) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.command = {
			command: commandId,
			title: label
		};
		this.iconPath = new vscode.ThemeIcon(iconName);
	}
}

export class KrataiTreeProvider implements vscode.TreeDataProvider<KrataiTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<KrataiTreeItem | undefined | null | void> = 
		new vscode.EventEmitter<KrataiTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<KrataiTreeItem | undefined | null | void> = 
		this._onDidChangeTreeData.event;

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: KrataiTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: KrataiTreeItem): Thenable<KrataiTreeItem[]> {
		if (!element) {
			// Root level items
			return Promise.resolve([
				new KrataiTreeItem('Generate Class Diagram', 'kratai.openClassDiagram', 'graph'),
				new KrataiTreeItem('Show Git Changes', 'kratai.openGitChanges', 'git-compare')
			]);
		}
		return Promise.resolve([]);
	}
}
