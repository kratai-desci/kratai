import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CodeParserService } from '../services/parsing/codeParserService';
import { DiagramGeneratorService } from '../services/diagram/diagramGeneratorService';
import { ClassDiagramView } from '../views/classDiagramView';
import { ConfigService } from '../services/config/configService';
import { GitDiffEnricher } from '../services/git/gitDiffEnricher';
import { TelemetryService } from '../services/telemetry/telemetryService';
import { KrataiConfig } from '../types/config';

export async function generateClassDiagram(context: vscode.ExtensionContext): Promise<void> {
	// Check if workspace is opened
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('No workspace folder is open!');
		return;
	}

	const workspaceFolder = vscode.workspace.workspaceFolders[0];
	const workspacePath = workspaceFolder.uri.fsPath;
	const workspaceName = workspaceFolder.name;

	try {
		// Check if config file exists
		const configPath = path.join(workspacePath, '.vscode/kratai.json');
		const configExists = fs.existsSync(configPath);

		if (configExists) {
			// Config exists, generate diagram directly
			await generateClassDiagramDirect(context);
		} else {
			// No config, show config panel first to let user review/modify before generating
			vscode.commands.executeCommand('kratai.showConfigPanel');
		}

	} catch (error) {
		vscode.window.showErrorMessage(`Error loading configuration: ${error}`);
	}
}

// New function for direct diagram generation (called from config panel or generateDiagramFromView)
export async function generateClassDiagramDirect(context: vscode.ExtensionContext): Promise<void> {
	// Check if workspace is opened
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		vscode.window.showErrorMessage('No workspace folder is open!');
		return;
	}

	const workspaceFolder = vscode.workspace.workspaceFolders[0];
	const workspacePath = workspaceFolder.uri.fsPath;
	const workspaceName = workspaceFolder.name;

	try {
		// Load config from workspace state (set by generateDiagramFromView or showConfigPanel)
		const config: KrataiConfig = context.workspaceState.get('currentViewConfig') || await ConfigService.loadConfig(workspacePath);
		const viewName: string = context.workspaceState.get('currentViewName') || workspaceName;
		
		console.log(`🔍 Generating diagram: ${viewName}`);

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: `Generating "${viewName}" diagram...`,
			cancellable: false
		}, async (progress) => {
			// Parse workspace
			progress.report({ message: 'Analyzing code...' });
			const diagramData = await CodeParserService.parseWorkspace(workspacePath, config);
			// Paths are now workspace-relative thanks to CodeParserService normalization

			// Enrich with git diff information if enabled
			if (config.gitDiff?.enabled !== false) {
				progress.report({ message: 'Analyzing git changes...' });
				const baseCommit = config.gitDiff?.baseCommit || 'HEAD~1';
				await GitDiffEnricher.enrichWithGitDiff(diagramData, workspacePath, baseCommit);
				console.log('🔍 Git diff analysis completed');
			}

			// Apply class type filters
			const classTypeFilters = config.classTypeFilters || {};
			const hasFilters = Object.keys(classTypeFilters).length > 0;

			const originalClassCount = diagramData.classes.length;
			if (hasFilters) {
				diagramData.classes = diagramData.classes.filter(classInfo => {
					const type = classInfo.classType || 'class';
					// If filter exists for this type, use it; otherwise default to true
					return classTypeFilters[type] !== false;
				});
				console.log(`🔍 Class type filter: ${originalClassCount} → ${diagramData.classes.length} classes`);
			}

			// Apply relationship type filters
			const relationshipTypeFilters = config.relationshipTypeFilters || {};
			const hasRelFilters = Object.keys(relationshipTypeFilters).length > 0;

			const originalRelCount = diagramData.relationships.length;
			if (hasRelFilters) {
				diagramData.relationships = diagramData.relationships.filter(rel => {
					// If filter exists for this type, use it; otherwise default to true
					return relationshipTypeFilters[rel.type] !== false;
				});
				console.log(`🔍 Relationship filter: ${originalRelCount} → ${diagramData.relationships.length} relationships`);
			}

			// Remove relationships referencing filtered-out classes
			const validClassIds = new Set(diagramData.classes.map(c => `${c.filePath}__${c.name}`));
			diagramData.relationships = diagramData.relationships.filter(rel => 
				validClassIds.has(rel.from) && validClassIds.has(rel.to)
			);

			console.log(`🔍 Cleaned relationships: ${diagramData.relationships.length} relationships after removing orphans`);

			if (diagramData.classes.length === 0) {
				vscode.window.showWarningMessage('No classes match the selected filters!');
				return;
			}

			// Generate diagram data
			progress.report({ message: 'Generating diagram...' });
			const { nodes, edges } = DiagramGeneratorService.generateReactFlowData(diagramData);

			// Create and show webview
			const panel = vscode.window.createWebviewPanel(
				'krataiClassDiagram',
				`Class Diagram: ${viewName}`,
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [vscode.Uri.joinPath(context.extensionUri)]
				}
			);

			const iconUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'icon.png'));
			panel.webview.html = ClassDiagramView.generate(nodes, edges, viewName, iconUri.toString());

			TelemetryService.trackGenerateClassDiagram(
				diagramData.classes.length,
				nodes.filter(n => n.type === 'folder').length,
				diagramData.relationships.length
			);

			// Track which column we opened files in (always use Column Two beside diagram)
			const fileEditorColumn = vscode.ViewColumn.Two;

			// Handle messages from the webview
			panel.webview.onDidReceiveMessage(
				async message => {
					switch (message.command) {
						case 'openSettings':
							// Get current view ID from workspace state
							const currentViewId = context.workspaceState.get<string>('currentViewId');
							if (currentViewId) {
								// Open config panel in edit mode for this diagram
								vscode.commands.executeCommand('kratai.showConfigPanel', {
									mode: 'edit',
									viewId: currentViewId
								});
							} else {
								// Fallback to create mode if no view ID
								vscode.commands.executeCommand('kratai.showConfigPanel');
							}
							break;
						
						case 'openMember':
						// Open file and highlight the entire method/property
						const memberFileUri = vscode.Uri.file(path.join(workspacePath, message.filePath));
						const startLine = (message.lineNumber || 1) - 1; // Convert to 0-based
						const endLine = (message.endLineNumber || message.lineNumber || 1) - 1; // Convert to 0-based
						
						// Open the file and select/highlight the entire range - always use Column Two
						const editor = await vscode.window.showTextDocument(memberFileUri, {
							viewColumn: fileEditorColumn,
							preserveFocus: false
						});
						
						// Select the entire method/property (highlight it)
						editor.selection = new vscode.Selection(startLine, 0, endLine, 9999);
						// Reveal the selection in the center of the viewport
						editor.revealRange(new vscode.Range(startLine, 0, endLine, 0), vscode.TextEditorRevealType.InCenter);
						break;
						case 'openFile':
						// Open file in editor - always use Column Two to avoid spawning multiple columns
						const fileUri = vscode.Uri.file(path.join(workspacePath, message.filePath));
						await vscode.window.showTextDocument(fileUri, {
							viewColumn: fileEditorColumn,
							preserveFocus: false
						});
						break;
					}
				},
				undefined,
				context.subscriptions
			);

			vscode.window.showInformationMessage(
				`Found ${diagramData.classes.length} classes with ${diagramData.relationships.length} relationships!`
			);
		});

	} catch (error) {
		vscode.window.showErrorMessage(`Error generating diagram: ${error}`);
	}
}
