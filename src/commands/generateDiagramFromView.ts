import * as vscode from 'vscode';
import { ViewManager } from '../services/view';

/**
 * Generate a diagram from a saved view
 */
export async function generateDiagramFromView(context: vscode.ExtensionContext, viewId: string): Promise<void> {
	// Check if workspace is opened
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('No workspace folder is open!');
		return;
	}

	const workspaceFolder = vscode.workspace.workspaceFolders[0];
	const workspacePath = workspaceFolder.uri.fsPath;

	try {
		// Load view configuration
		const config = await ViewManager.loadViewConfig(workspacePath, viewId);
		const view = await ViewManager.getView(workspacePath, viewId);

		if (!view) {
			vscode.window.showErrorMessage(`View not found: ${viewId}`);
			return;
		}

		// Store current view context for generateClassDiagramDirect
		context.workspaceState.update('currentViewId', viewId);
		context.workspaceState.update('currentViewName', view.name);
		context.workspaceState.update('currentViewConfig', config);

		// Generate diagram using the view's config
		await vscode.commands.executeCommand('kratai.generateClassDiagramDirect');

		// Update last generated timestamp
		await ViewManager.updateLastGenerated(workspacePath, viewId);
		
		// Refresh sidebar to show updated timestamp
		await vscode.commands.executeCommand('kratai.refreshViews');

	} catch (error) {
		vscode.window.showErrorMessage(`Error generating diagram: ${error}`);
	}
}
