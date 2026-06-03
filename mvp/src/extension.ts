// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "kratai" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('kratai.showFileSummary', async () => {
		await showFileSummary(context);
	});

	context.subscriptions.push(disposable);
}

async function showFileSummary(context: vscode.ExtensionContext) {
	// Check if workspace is opened
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('No workspace folder is open!');
		return;
	}

	// Get workspace folder
	const workspaceFolder = vscode.workspace.workspaceFolders[0];
	const workspaceName = workspaceFolder.name;

	// Count files by extension
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Analyzing workspace files...",
		cancellable: false
	}, async (progress) => {
		const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
		
		// Count by extension
		const extensionCounts: { [key: string]: number } = {};
		let totalFiles = files.length;
		
		files.forEach(file => {
			const ext = path.extname(file.fsPath) || 'no extension';
			extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
		});

		// Sort by count
		const sortedExtensions = Object.entries(extensionCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10); // Top 10 extensions

		// Create and show webview
		const panel = vscode.window.createWebviewPanel(
			'krataiFileSummary',
			'📊 File Summary',
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		);

		panel.webview.html = getWebviewContent(workspaceName, totalFiles, sortedExtensions);
	});
}

function getWebviewContent(workspaceName: string, totalFiles: number, extensions: [string, number][]): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Summary</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        h1 {
            font-size: 2.5em;
            margin: 0 0 10px 0;
            text-align: center;
            font-weight: 700;
        }
        .workspace-name {
            text-align: center;
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        .total-count {
            text-align: center;
            font-size: 3em;
            font-weight: bold;
            margin: 30px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .stats {
            margin-top: 30px;
        }
        .stat-item {
            background: rgba(255, 255, 255, 0.15);
            padding: 15px 20px;
            margin: 10px 0;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.2s;
        }
        .stat-item:hover {
            transform: translateX(5px);
            background: rgba(255, 255, 255, 0.2);
        }
        .extension {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            font-size: 1.1em;
        }
        .count {
            background: rgba(255, 255, 255, 0.3);
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
        }
        .emoji {
            font-size: 3em;
            text-align: center;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">📊</div>
        <h1>File Summary</h1>
        <div class="workspace-name">📁 ${workspaceName}</div>
        <div class="total-count">${totalFiles} files</div>
        <div class="stats">
            <h2 style="text-align: center; margin-bottom: 20px;">Top File Types</h2>
            ${extensions.map(([ext, count]) => `
                <div class="stat-item">
                    <span class="extension">${ext}</span>
                    <span class="count">${count}</span>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
