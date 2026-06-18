import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CodeParserService } from '../services/codeParserService';
import { DiagramGeneratorService } from '../services/diagramGeneratorService';
import { ClassDiagramView } from '../views/classDiagramView';
import { ConfigService } from '../services/configService';
import { GitDiffEnricher } from '../services/gitDiffEnricher';
import { MethodTracerService } from '../services/methodTracerService';
import { SequenceDiagramView } from '../views/sequenceDiagramView';
import { TelemetryService } from '../services/telemetryService';

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

// New function for direct diagram generation (called from config panel)
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
		// Load config and show info
		const config = await ConfigService.loadConfig(workspacePath);
		const configInfo = ConfigService.getProjectInfo(config);
		
		console.log('🔍 Kratai Config:', configInfo);

		await vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Generating class diagram...",
			cancellable: false
		}, async (progress) => {
			// Parse workspace
			progress.report({ message: 'Analyzing code...' });
			const diagramData = await CodeParserService.parseWorkspace(workspacePath);
			// Paths are now workspace-relative thanks to CodeParserService normalization

			// Enrich with git diff information if enabled
			if (config.gitDiff?.enabled !== false) {
				progress.report({ message: 'Analyzing git changes...' });
				const baseCommit = config.gitDiff?.baseCommit || 'HEAD~1';
				await GitDiffEnricher.enrichWithGitDiff(diagramData, workspacePath, baseCommit);
				console.log('🔍 Git diff analysis completed');
			}

			// Deduplicate classes (config with overlapping folder paths causes duplicates)
			const originalCount = diagramData.classes.length;
			const classMap = new Map<string, typeof diagramData.classes[0]>();
			diagramData.classes.forEach(classInfo => {
				const key = `${classInfo.filePath}:${classInfo.name}`;
				if (!classMap.has(key)) {
					classMap.set(key, classInfo);
				}
			});
			diagramData.classes = Array.from(classMap.values());
			
			if (originalCount > diagramData.classes.length) {
				console.log(`🔧 Deduplicated: ${originalCount} → ${diagramData.classes.length} classes (removed ${originalCount - diagramData.classes.length} duplicates)`);
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
				'Class Diagram',
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [vscode.Uri.joinPath(context.extensionUri)]
				}
			);

			const iconUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'icon.png'));
			panel.webview.html = ClassDiagramView.generate(nodes, edges, workspaceName, iconUri.toString());

			TelemetryService.trackGenerateClassDiagram(
				diagramData.classes.length,
				nodes.filter(n => n.type === 'folder').length,
				diagramData.relationships.length
			);

			// Track sequence diagram panel for reuse
			let sequencePanel: vscode.WebviewPanel | undefined;
			
			// Track which column we opened files in (always use Column Two beside diagram)
			const fileEditorColumn = vscode.ViewColumn.Two;

			// Handle messages from the webview
			panel.webview.onDidReceiveMessage(
				async message => {
					switch (message.command) {
						case 'openSettings':
							vscode.commands.executeCommand('kratai.showConfigPanel');
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
						break;						case 'openMethodSequence':
						// Trace method calls
						vscode.window.withProgress({
							location: vscode.ProgressLocation.Notification,
							title: `Tracing ${message.className}.${message.methodName}()...`,
							cancellable: false
						}, async () => {
							const sequenceData = await MethodTracerService.traceMethod(
								message.className,
								message.methodName,
								message.filePath,
								workspacePath,
								diagramData,
								10 // max depth
							);
							
							// Reuse existing sequence panel if available, or create new one
							if (!sequencePanel) {
								// Create new sequence diagram panel
								sequencePanel = vscode.window.createWebviewPanel(
									'krataiSequenceDiagram',
									`${message.className}.${message.methodName}()`,
									vscode.ViewColumn.Beside,
									{
										enableScripts: true,
										retainContextWhenHidden: true,
										localResourceRoots: [vscode.Uri.joinPath(context.extensionUri)]
									}
								);
								
								// Clear reference when panel is disposed
								sequencePanel.onDidDispose(() => {
									sequencePanel = undefined;
								});
							} else {
								// Reuse existing panel - update title and reveal
								sequencePanel.title = `${message.className}.${message.methodName}()`;
								sequencePanel.reveal(vscode.ViewColumn.Beside, false);
							}
							
							const seqIconUri = sequencePanel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'icon.png'));
							
							// Generate and show sequence diagram
							sequencePanel.webview.html = SequenceDiagramView.generate(
								message.className,
								message.methodName,
								message.filePath,
								sequenceData,
								seqIconUri.toString()
							);
							TelemetryService.trackOpenSequenceDiagram(
								sequenceData.actors.size,
								sequenceData.calls.length,
								sequenceData.maxDepth
							);
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
