import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Register skill management commands
 */
export function registerSkillCommands(context: vscode.ExtensionContext): void {
	// View skill command
	context.subscriptions.push(
		vscode.commands.registerCommand('kratai.skill.view', async (skillPath: string) => {
			if (fs.existsSync(skillPath)) {
				const doc = await vscode.workspace.openTextDocument(skillPath);
				await vscode.window.showTextDocument(doc, {
					preview: true,
					viewColumn: vscode.ViewColumn.Beside
				});
			} else {
				vscode.window.showWarningMessage(
					'Skill not installed yet. It will be auto-installed when you open a workspace.'
				);
			}
		})
	);
}

/**
 * Auto-install skill to workspace .vscode folder
 */
export async function autoInstallSkill(context: vscode.ExtensionContext): Promise<void> {
	console.log('🎓 [Kratai] Starting skill auto-install...');
	
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) {
		console.log('🎓 [Kratai] No workspace folder found, skipping skill install');
		return;
	}

	console.log('🎓 [Kratai] Workspace:', workspaceFolder.uri.fsPath);

	const vscodeDir = path.join(workspaceFolder.uri.fsPath, '.vscode');
	const skillPath = path.join(vscodeDir, 'kratai-architecture.SKILL.md');

	// Skip if already installed
	if (fs.existsSync(skillPath)) {
		console.log('🎓 [Kratai] Skill already installed at:', skillPath);
		return;
	}

	// Get skill from extension
	const extensionSkillPath = path.join(
		context.extensionPath,
		'skills',
		'kratai-architecture.SKILL.md'
	);

	console.log('🎓 [Kratai] Looking for skill at:', extensionSkillPath);

	if (!fs.existsSync(extensionSkillPath)) {
		console.error('🎓 [Kratai] ❌ Skill file not found in extension:', extensionSkillPath);
		return;
	}

	console.log('🎓 [Kratai] ✅ Skill file found, copying to workspace...');

	try {
		// Create .vscode directory if needed
		if (!fs.existsSync(vscodeDir)) {
			fs.mkdirSync(vscodeDir, { recursive: true });
		}

		// Copy skill file
		fs.copyFileSync(extensionSkillPath, skillPath);

		// Show notification (once per workspace)
		const notifiedKey = `kratai.skillNotified.${workspaceFolder.uri.fsPath}`;
		const notified = context.globalState.get(notifiedKey, false);

		if (!notified) {
			const result = await vscode.window.showInformationMessage(
				'🎯 Kratai: AI will now follow your architecture patterns!',
				'View Skill'
			);

			if (result === 'View Skill') {
				vscode.commands.executeCommand('kratai.skill.view', skillPath);
			}

			context.globalState.update(notifiedKey, true);
		}

		// Refresh tree view to show skill
		vscode.commands.executeCommand('kratai.refreshTreeView');
	} catch (error) {
		console.error('Failed to install skill:', error);
	}
}
