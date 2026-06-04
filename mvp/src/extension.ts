// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { showGitChanges, generateClassDiagram } from './commands';
import { KrataiTreeProvider } from './views/krataiTreeProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "kratai" is now active!');

	// Register sidebar view
	const treeProvider = new KrataiTreeProvider();
	vscode.window.registerTreeDataProvider('kratai-actions', treeProvider);

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

	// Register all commands
	context.subscriptions.push(
		vscode.commands.registerCommand('kratai.showFileSummary', () => showGitChanges(context)),
		vscode.commands.registerCommand('kratai.generateClassDiagram', () => generateClassDiagram(context))
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
