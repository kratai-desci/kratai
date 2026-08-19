import * as fs from 'fs';
import * as path from 'path';
import { dialog, ipcMain, shell } from 'electron';
import {
	ConfigService,
	KrataiConfig,
	ViewManager,
	WorkspaceScanner
} from '@kratai/core';
import { ConfigPanelView } from './configPanelView';
import { GitChangesView } from './gitChangesView';
import { GitOperations } from '@kratai/core';
import { addRecentWorkspace, listRecentWorkspaces } from './workspaceStore';
import { AVAILABLE_REL_TYPES, buildFolderTree, countRelationshipsByType, detectAvailableTypes } from './configPanelData';
import { exportMarkdown, generateDiagram } from './diagramService';
import { getIconDataUri } from './icon';

export function registerIpcHandlers(): void {
	ipcMain.handle('openWorkspace', async () => {
		const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
		if (result.canceled || result.filePaths.length === 0) {
			return undefined;
		}
		const workspacePath = result.filePaths[0];
		addRecentWorkspace(workspacePath);
		return workspacePath;
	});

	ipcMain.handle('listRecentWorkspaces', () => listRecentWorkspaces());

	ipcMain.handle('listViews', (_event, workspacePath: string) => ViewManager.listViews(workspacePath));

	ipcMain.handle('listExports', (_event, workspacePath: string) => {
		const exportsDir = path.join(workspacePath, '.kratai', 'exports');
		if (!fs.existsSync(exportsDir)) {
			return [];
		}
		return fs.readdirSync(exportsDir)
			.filter(file => file.endsWith('.md'))
			.map(file => {
				const filePath = path.join(exportsDir, file);
				return { name: file, path: filePath, modifiedAt: fs.statSync(filePath).mtime.toISOString() };
			})
			.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
	});

	ipcMain.handle('generateDiagram', async (_event, workspacePath: string, viewId?: string) => {
		let config: KrataiConfig;
		let viewName: string;

		if (viewId) {
			const view = await ViewManager.getView(workspacePath, viewId);
			if (!view) {
				throw new Error(`Diagram not found: ${viewId}`);
			}
			config = await ViewManager.loadViewConfig(workspacePath, viewId);
			viewName = view.name;
			await ViewManager.updateLastGenerated(workspacePath, viewId);
		} else {
			config = await ConfigService.loadConfig(workspacePath);
			viewName = path.basename(workspacePath);
		}

		return generateDiagram(workspacePath, config, viewName);
	});

	ipcMain.handle('getConfigPanelData', async (_event, workspacePath: string, options?: { mode?: 'create' | 'edit'; viewId?: string; viewName?: string }) => {
		const mode = options?.mode || 'create';
		let diagramName: string;
		let viewId: string | undefined;
		let config: KrataiConfig;

		if (mode === 'edit' && options?.viewId) {
			viewId = options.viewId;
			const view = await ViewManager.getView(workspacePath, viewId);
			if (!view) {
				throw new Error(`Diagram not found: ${viewId}`);
			}
			diagramName = view.name;
			config = await ViewManager.loadViewConfig(workspacePath, viewId);
		} else {
			diagramName = options?.viewName || '';
			if (!diagramName) {
				const views = await ViewManager.listViews(workspacePath);
				diagramName = `diagram-${views.length + 1}`;
			}
			config = ConfigService.generateSmartDefaults(workspacePath);
		}

		const selectedFolders = ConfigService.getSelectedFolders(config);
		const folderTree = buildFolderTree(workspacePath, selectedFolders);
		const extensions = WorkspaceScanner.scanExtensionCounts(workspacePath);
		extensions.forEach(ext => {
			ext.selected = config.selectedExtensions.includes(ext.extension);
		});

		const availableTypes = await detectAvailableTypes(workspacePath);
		const relationshipCounts = mode === 'edit' ? await countRelationshipsByType(workspacePath, config) : {};

		const html = ConfigPanelView.generate(
			folderTree, extensions, config, availableTypes, AVAILABLE_REL_TYPES, diagramName, mode, relationshipCounts
		);

		return { html, mode, diagramName, viewId, config };
	});

	ipcMain.handle('saveViewConfig', async (
		_event,
		workspacePath: string,
		payload: { mode: 'create' | 'edit'; viewId?: string; diagramName: string; config: KrataiConfig }
	) => {
		const { mode, diagramName, config } = payload;
		let viewId = payload.viewId;

		if (mode === 'edit' && viewId) {
			await ViewManager.saveViewConfig(workspacePath, viewId, config);
			const existingView = await ViewManager.getView(workspacePath, viewId);
			if (existingView && existingView.name !== diagramName) {
				viewId = await ViewManager.updateView(workspacePath, viewId, { name: diagramName });
			}
		} else {
			const newView = await ViewManager.createView(workspacePath, diagramName, config);
			viewId = newView.id;
		}

		return { viewId };
	});

	ipcMain.handle('deleteView', async (_event, workspacePath: string, viewId: string) => {
		await ViewManager.deleteView(workspacePath, viewId);
	});

	ipcMain.handle('analyzeGitChanges', async (_event, workspacePath: string, workspaceName: string) => {
		const result = await GitOperations.analyzeChanges(workspacePath, workspaceName);
		if (!result) {
			throw new Error('Could not analyze git changes.');
		}
		return { html: GitChangesView.generate(result, getIconDataUri()) };
	});

	ipcMain.handle('exportMarkdown', (_event, workspacePath: string, diagramName: string) =>
		exportMarkdown(workspacePath, diagramName)
	);

	ipcMain.handle('openPath', (_event, absolutePath: string) => shell.openPath(absolutePath));
}
