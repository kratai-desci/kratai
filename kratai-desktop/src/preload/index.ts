import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('kratai', {
	openWorkspace: () => ipcRenderer.invoke('openWorkspace'),
	listRecentWorkspaces: () => ipcRenderer.invoke('listRecentWorkspaces'),
	listViews: (workspacePath: string) => ipcRenderer.invoke('listViews', workspacePath),
	listExports: (workspacePath: string) => ipcRenderer.invoke('listExports', workspacePath),
	generateDiagram: (workspacePath: string, viewId?: string) =>
		ipcRenderer.invoke('generateDiagram', workspacePath, viewId),
	getConfigPanelData: (workspacePath: string, options?: { mode?: 'create' | 'edit'; viewId?: string; viewName?: string }) =>
		ipcRenderer.invoke('getConfigPanelData', workspacePath, options),
	saveViewConfig: (workspacePath: string, payload: unknown) =>
		ipcRenderer.invoke('saveViewConfig', workspacePath, payload),
	deleteView: (workspacePath: string, viewId: string) =>
		ipcRenderer.invoke('deleteView', workspacePath, viewId),
	analyzeGitChanges: (workspacePath: string, workspaceName: string) =>
		ipcRenderer.invoke('analyzeGitChanges', workspacePath, workspaceName),
	exportMarkdown: (workspacePath: string, diagramName: string) =>
		ipcRenderer.invoke('exportMarkdown', workspacePath, diagramName),
	openPath: (absolutePath: string) => ipcRenderer.invoke('openPath', absolutePath)
});
