// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { showGitChanges, generateClassDiagram, generateClassDiagramDirect, showConfigPanel } from './commands';
import { KrataiTreeProvider } from './views/krataiTreeProvider';
import { TelemetryService } from './services/telemetry/telemetryService';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('🐰 Kratai extension is now activating...');

	// Initialize telemetry (respects VS Code's telemetry.telemetryLevel setting automatically)
	TelemetryService.initialize();
	context.subscriptions.push({ dispose: () => TelemetryService.dispose() });

	// Register sidebar view
	console.log('🐰 Registering tree data provider for kratai-actions...');
	const treeProvider = new KrataiTreeProvider();
	const disposable = vscode.window.registerTreeDataProvider('kratai-actions', treeProvider);
	context.subscriptions.push(disposable);
	console.log('🐰 Tree data provider registered successfully');

	// Register sidebar action commands
	context.subscriptions.push(
		vscode.commands.registerCommand('kratai.openClassDiagram', () => {
			vscode.commands.executeCommand('kratai.generateClassDiagram');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kratai.openGitChanges', () => {
			vscode.commands.executeCommand('kratai.showFileSummary');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kratai.openCommunity', () => {
			TelemetryService.trackOpenCommunity();
			vscode.env.openExternal(vscode.Uri.parse('https://github.com/kratai-desci/kratai/discussions'));
		})
	);

	// Register all commands
	context.subscriptions.push(
		vscode.commands.registerCommand('kratai.showFileSummary', () => showGitChanges(context)),
		vscode.commands.registerCommand('kratai.generateClassDiagram', () => generateClassDiagram(context)),
		vscode.commands.registerCommand('kratai.generateClassDiagramDirect', () => generateClassDiagramDirect(context)),
		vscode.commands.registerCommand('kratai.showConfigPanel', () => showConfigPanel(context))
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
