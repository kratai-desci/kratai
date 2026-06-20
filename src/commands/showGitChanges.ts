import * as vscode from 'vscode';
import { GitOperations } from '../services/git/gitOperations';
import { GitChangesView } from '../views/gitChangesView';
import { TelemetryService } from '../services/telemetry/telemetryService';

export async function showGitChanges(context: vscode.ExtensionContext): Promise<void> {
	// Check if workspace is opened
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('No workspace folder is open!');
		return;
	}

	const workspaceFolder = vscode.workspace.workspaceFolders[0];
	const workspacePath = workspaceFolder.uri.fsPath;
	const workspaceName = workspaceFolder.name;

	try {
		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Analyzing changes...",
			cancellable: false
		}, async (progress) => {
			progress.report({ message: 'Fetching from remote...' });
			
			const result = await GitOperations.analyzeChanges(workspacePath, workspaceName);
			
			if (!result) {
				vscode.window.showErrorMessage('Could not analyze git changes!');
				return;
			}

			// Create and show webview
			const panel = vscode.window.createWebviewPanel(
				'krataiGitDiff',
				'Git Changes',
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					localResourceRoots: [vscode.Uri.joinPath(context.extensionUri)]
				}
			);
			const iconUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'icon.png'));
			panel.webview.html = GitChangesView.generate(result, iconUri.toString());
			TelemetryService.trackShowGitChanges(result.changes.length);
		});

	} catch (error) {
		vscode.window.showErrorMessage(`Error: ${error}`);
	}
}
