// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { execSync } from 'child_process';

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
		await showGitDiff(context);
	});

	context.subscriptions.push(disposable);
}

interface FileChange {
	path: string;
	status: 'modified' | 'added' | 'deleted' | 'renamed';
	additions?: number;
	deletions?: number;
}

async function showGitDiff(context: vscode.ExtensionContext) {
	// Check if workspace is opened
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('No workspace folder is open!');
		return;
	}

	// Get workspace folder
	const workspaceFolder = vscode.workspace.workspaceFolders[0];
	const workspacePath = workspaceFolder.uri.fsPath;
	const workspaceName = workspaceFolder.name;

	try {
		// Check if it's a git repository
		try {
			execSync('git rev-parse --git-dir', { cwd: workspacePath, stdio: 'pipe' });
		} catch {
			vscode.window.showErrorMessage('This is not a Git repository!');
			return;
		}

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Analyzing changes...",
			cancellable: false
		}, async (progress) => {
			// Get current branch
			const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', 
				{ cwd: workspacePath, encoding: 'utf-8' }).trim();

			// Get remote name (usually origin)
			let remoteName = 'origin';
			try {
				remoteName = execSync('git remote', 
					{ cwd: workspacePath, encoding: 'utf-8' }).trim().split('\n')[0];
			} catch { }

			// Fetch latest from remote
			progress.report({ message: 'Fetching from remote...' });
			try {
				execSync(`git fetch ${remoteName}`, { cwd: workspacePath, stdio: 'pipe' });
			} catch (error) {
				console.log('Fetch warning:', error);
			}

			// Get remote branch
			const remoteBranch = `${remoteName}/${currentBranch}`;

			// Check if remote branch exists
			let compareTarget = remoteBranch;
			try {
				execSync(`git rev-parse ${remoteBranch}`, { cwd: workspacePath, stdio: 'pipe' });
			} catch {
				// Remote branch doesn't exist, use origin/main or origin/master
				try {
					execSync(`git rev-parse ${remoteName}/main`, { cwd: workspacePath, stdio: 'pipe' });
					compareTarget = `${remoteName}/main`;
				} catch {
					try {
						execSync(`git rev-parse ${remoteName}/master`, { cwd: workspacePath, stdio: 'pipe' });
						compareTarget = `${remoteName}/master`;
					} catch {
						vscode.window.showErrorMessage('Could not find remote branch to compare!');
						return;
					}
				}
			}

			// Get uncommitted changes (working directory + staged)
			progress.report({ message: 'Calculating differences...' });
			const uncommittedStatus = execSync(
				'git status --porcelain',
				{ cwd: workspacePath, encoding: 'utf-8' }
			).trim();

			// Get committed but unpushed changes
			let diffOutput = '';
			let statusOutput = '';
			try {
				diffOutput = execSync(
					`git diff --numstat ${compareTarget}...HEAD`,
					{ cwd: workspacePath, encoding: 'utf-8' }
				).trim();

				statusOutput = execSync(
					`git diff --name-status ${compareTarget}...HEAD`,
					{ cwd: workspacePath, encoding: 'utf-8' }
				).trim();
			} catch {
				// Might fail if branches have diverged or no common base
			}

			const changes: FileChange[] = [];

			// Process uncommitted changes first
			if (uncommittedStatus) {
				const uncommittedLines = uncommittedStatus.split('\n');
				for (const line of uncommittedLines) {
					if (line.length < 3) continue;
					
					const statusCode = line.substring(0, 2).trim();
					const filePath = line.substring(3);

					let status: FileChange['status'] = 'modified';
					if (statusCode === 'A' || statusCode === 'AM' || statusCode === '??' || statusCode === 'A ') {
						status = 'added';
					} else if (statusCode === 'D' || statusCode === ' D') {
						status = 'deleted';
					} else if (statusCode.startsWith('R')) {
						status = 'renamed';
					}

					// Get numstat for modified files
					let additions = 0, deletions = 0;
					if (status === 'modified' || statusCode.includes('M')) {
						try {
							const numstat = execSync(
								`git diff HEAD --numstat -- "${filePath}"`,
								{ cwd: workspacePath, encoding: 'utf-8' }
							).trim();
							if (numstat) {
								const parts = numstat.split('\t');
								if (parts.length >= 2) {
									additions = parts[0] === '-' ? 0 : parseInt(parts[0], 10);
									deletions = parts[1] === '-' ? 0 : parseInt(parts[1], 10);
								}
							}
						} catch { }
					}

					changes.push({ path: filePath, status, additions, deletions });
				}
			}

			// Process committed but unpushed changes
			if (statusOutput) {
				const statusLines = statusOutput.split('\n');
				const diffLines = diffOutput ? diffOutput.split('\n') : [];

				for (const line of statusLines) {
					const parts = line.split('\t');
					if (parts.length < 2) continue;

					const statusCode = parts[0];
					const filePath = parts[1];

					// Skip if already in uncommitted changes
					if (changes.some(c => c.path === filePath)) continue;

					let status: FileChange['status'] = 'modified';
					if (statusCode === 'A') status = 'added';
					else if (statusCode === 'D') status = 'deleted';
					else if (statusCode.startsWith('R')) status = 'renamed';

					// Find corresponding numstat line
					const diffLine = diffLines.find(dl => dl.endsWith(filePath));
					let additions = 0, deletions = 0;

					if (diffLine) {
						const numStats = diffLine.split('\t');
						if (numStats.length >= 2) {
							additions = numStats[0] === '-' ? 0 : parseInt(numStats[0], 10);
							deletions = numStats[1] === '-' ? 0 : parseInt(numStats[1], 10);
						}
					}

					changes.push({ path: filePath, status, additions, deletions });
				}
			}

			// Create and show webview
			const panel = vscode.window.createWebviewPanel(
				'krataiGitDiff',
				'🔄 Git Changes',
				vscode.ViewColumn.One,
				{
					enableScripts: true
				}
			);

			panel.webview.html = getGitDiffContent(workspaceName, currentBranch, compareTarget, changes);
		});

	} catch (error) {
		vscode.window.showErrorMessage(`Error: ${error}`);
	}
}

function getGitDiffContent(workspaceName: string, currentBranch: string, compareTarget: string, changes: FileChange[]): string {
	const totalChanges = changes.length;
	const modified = changes.filter(c => c.status === 'modified').length;
	const added = changes.filter(c => c.status === 'added').length;
	const deleted = changes.filter(c => c.status === 'deleted').length;
	const renamed = changes.filter(c => c.status === 'renamed').length;

	const totalAdditions = changes.reduce((sum, c) => sum + (c.additions || 0), 0);
	const totalDeletions = changes.reduce((sum, c) => sum + (c.deletions || 0), 0);

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git Changes</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            min-height: 100vh;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
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
            margin-bottom: 10px;
        }
        .branch-info {
            text-align: center;
            font-size: 0.95em;
            opacity: 0.8;
            margin-bottom: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 30px 0;
        }
        .summary-card {
            background: rgba(255, 255, 255, 0.15);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }
        .summary-card .number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .summary-card .label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        .changes-list {
            margin-top: 30px;
        }
        .change-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px 20px;
            margin: 8px 0;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.2s, background 0.2s;
            border-left: 4px solid transparent;
        }
        .change-item:hover {
            transform: translateX(5px);
            background: rgba(255, 255, 255, 0.15);
        }
        .change-item.modified { border-left-color: #ffc107; }
        .change-item.added { border-left-color: #4caf50; }
        .change-item.deleted { border-left-color: #f44336; }
        .change-item.renamed { border-left-color: #2196f3; }
        .file-path {
            font-family: 'Courier New', monospace;
            font-size: 0.95em;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .file-stats {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .status-badge {
            background: rgba(255, 255, 255, 0.3);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .stats-badge {
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .additions { color: #4caf50; }
        .deletions { color: #f44336; }
        .emoji {
            font-size: 3em;
            text-align: center;
            margin-bottom: 20px;
        }
        .no-changes {
            text-align: center;
            padding: 60px 20px;
            opacity: 0.8;
            font-size: 1.2em;
        }
        .diff-summary {
            text-align: center;
            margin: 20px 0;
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="emoji">🔄</div>
        <h1>Git Changes</h1>
        <div class="workspace-name">📁 ${workspaceName}</div>
        <div class="branch-info">Comparing: ${currentBranch} ← ${compareTarget}</div>
        
        ${totalChanges === 0 ? `
            <div class="no-changes">
                ✨ No changes detected!<br>
                Your local branch is up to date with the remote.
            </div>
        ` : `
            <div class="summary">
                <div class="summary-card">
                    <div class="number">${totalChanges}</div>
                    <div class="label">Total Changes</div>
                </div>
                <div class="summary-card">
                    <div class="number" style="color: #ffc107;">${modified}</div>
                    <div class="label">Modified</div>
                </div>
                <div class="summary-card">
                    <div class="number" style="color: #4caf50;">${added}</div>
                    <div class="label">Added</div>
                </div>
                <div class="summary-card">
                    <div class="number" style="color: #f44336;">${deleted}</div>
                    <div class="label">Deleted</div>
                </div>
            </div>
            
            <div class="diff-summary">
                <span class="additions">++${totalAdditions}</span> /
                <span class="deletions">--${totalDeletions}</span>
            </div>
            
            <div class="changes-list">
                <h2 style="text-align: center; margin-bottom: 20px;">Changed Files</h2>
                ${changes.map(change => `
                    <div class="change-item ${change.status}">
                        <div class="file-path">${change.path}</div>
                        <div class="file-stats">
                            ${change.additions !== undefined && change.deletions !== undefined ? `
                                <span class="stats-badge">
                                    <span class="additions">+${change.additions}</span>
                                    <span class="deletions">-${change.deletions}</span>
                                </span>
                            ` : ''}
                            <span class="status-badge">${change.status}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    </div>
</body>
</html>`;
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
