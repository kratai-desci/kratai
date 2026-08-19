interface DiagramViewSummary {
	id: string;
	name: string;
	lastGenerated?: string;
}

interface ExportSummary {
	name: string;
	path: string;
	modifiedAt: string;
}

interface ConfigPanelResult {
	html: string;
	mode: 'create' | 'edit';
	diagramName: string;
	viewId?: string;
	config: Record<string, unknown>;
}

interface KrataiApi {
	openWorkspace(): Promise<string | undefined>;
	listRecentWorkspaces(): Promise<string[]>;
	listViews(workspacePath: string): Promise<DiagramViewSummary[]>;
	listExports(workspacePath: string): Promise<ExportSummary[]>;
	generateDiagram(workspacePath: string, viewId?: string): Promise<{ html: string; classCount: number; relationshipCount: number }>;
	getConfigPanelData(workspacePath: string, options?: { mode?: 'create' | 'edit'; viewId?: string }): Promise<ConfigPanelResult>;
	saveViewConfig(workspacePath: string, payload: unknown): Promise<{ viewId: string }>;
	deleteView(workspacePath: string, viewId: string): Promise<void>;
	analyzeGitChanges(workspacePath: string, workspaceName: string): Promise<{ html: string }>;
	exportMarkdown(workspacePath: string, diagramName: string): Promise<{ filePath: string }>;
	openPath(absolutePath: string): Promise<string>;
}

declare global {
	interface Window {
		kratai: KrataiApi;
	}
}

const workspacePathEl = document.getElementById('workspace-path')!;
const newDiagramBtn = document.getElementById('new-diagram-btn') as HTMLButtonElement;
const gitChangesBtn = document.getElementById('git-changes-btn') as HTMLButtonElement;
const openWorkspaceBtn = document.getElementById('open-workspace-btn') as HTMLButtonElement;
const diagramsList = document.getElementById('diagrams-list')!;
const exportsList = document.getElementById('exports-list')!;
const emptyState = document.getElementById('empty-state')!;
const frame = document.getElementById('content-frame') as HTMLIFrameElement;

let currentWorkspace: string | undefined;
let currentDiagramViewId: string | undefined;
let currentConfigPanel: { mode: 'create' | 'edit'; viewId?: string; diagramName: string; config: Record<string, unknown> } | undefined;

function joinPath(base: string, relative: string): string {
	const sep = base.includes('\\') && !base.includes('/') ? '\\' : '/';
	return base.replace(/[\\/]+$/, '') + sep + relative.replace(/^[\\/]+/, '');
}

function basename(p: string): string {
	return p.split(/[\\/]/).filter(Boolean).pop() || p;
}

function renderContent(html: string): void {
	emptyState.style.display = 'none';
	frame.style.display = 'block';
	frame.srcdoc = html;
}

function showEmpty(): void {
	emptyState.style.display = 'flex';
	frame.style.display = 'none';
	frame.srcdoc = '';
	currentDiagramViewId = undefined;
	currentConfigPanel = undefined;
}

async function setWorkspace(workspacePath: string): Promise<void> {
	currentWorkspace = workspacePath;
	workspacePathEl.textContent = workspacePath;
	newDiagramBtn.disabled = false;
	gitChangesBtn.disabled = false;
	showEmpty();
	await refreshSidebar();
}

async function refreshSidebar(): Promise<void> {
	if (!currentWorkspace) return;
	const [views, exports] = await Promise.all([
		window.kratai.listViews(currentWorkspace),
		window.kratai.listExports(currentWorkspace)
	]);

	diagramsList.innerHTML = '';
	if (views.length === 0) {
		diagramsList.innerHTML = '<li class="empty-hint">No diagrams yet</li>';
	} else {
		for (const view of views) {
			const li = document.createElement('li');

			const label = document.createElement('span');
			label.className = 'item-label';
			label.textContent = view.name;
			label.title = view.lastGenerated ? `Last generated: ${new Date(view.lastGenerated).toLocaleString()}` : 'Never generated';
			label.addEventListener('click', () => void openDiagram(view.id));

			const editBtn = document.createElement('button');
			editBtn.className = 'edit-btn';
			editBtn.textContent = '⚙️';
			editBtn.title = 'Edit settings';
			editBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				void openConfigPanel('edit', view.id);
			});

			li.appendChild(label);
			li.appendChild(editBtn);
			diagramsList.appendChild(li);
		}
	}

	exportsList.innerHTML = '';
	if (exports.length === 0) {
		exportsList.innerHTML = '<li class="empty-hint">No exports yet</li>';
	} else {
		for (const exp of exports) {
			const li = document.createElement('li');
			const label = document.createElement('span');
			label.className = 'item-label';
			label.textContent = exp.name;
			label.title = `Modified: ${new Date(exp.modifiedAt).toLocaleString()}`;
			li.appendChild(label);
			li.addEventListener('click', () => void window.kratai.openPath(exp.path));
			exportsList.appendChild(li);
		}
	}
}

async function openDiagram(viewId?: string): Promise<void> {
	if (!currentWorkspace) return;
	currentConfigPanel = undefined;
	const result = await window.kratai.generateDiagram(currentWorkspace, viewId);
	currentDiagramViewId = viewId;
	renderContent(result.html);
}

async function openConfigPanel(mode: 'create' | 'edit', viewId?: string): Promise<void> {
	if (!currentWorkspace) return;
	const result = await window.kratai.getConfigPanelData(currentWorkspace, { mode, viewId });
	currentConfigPanel = { mode: result.mode, viewId: result.viewId, diagramName: result.diagramName, config: result.config };
	renderContent(result.html);
}

async function openGitChanges(): Promise<void> {
	if (!currentWorkspace) return;
	currentConfigPanel = undefined;
	const result = await window.kratai.analyzeGitChanges(currentWorkspace, basename(currentWorkspace));
	renderContent(result.html);
}

openWorkspaceBtn.addEventListener('click', async () => {
	const workspacePath = await window.kratai.openWorkspace();
	if (workspacePath) {
		await setWorkspace(workspacePath);
	}
});

newDiagramBtn.addEventListener('click', () => void openConfigPanel('create'));
gitChangesBtn.addEventListener('click', () => void openGitChanges());

window.addEventListener('message', (event) => {
	if (event.source !== frame.contentWindow || !currentWorkspace) return;
	const message = event.data as Record<string, unknown> | undefined;
	const workspacePath = currentWorkspace;

	void (async () => {
		switch (message?.command) {
			case 'openFile':
			case 'openMember': {
				const filePath = message.filePath as string | undefined;
				if (filePath) {
					await window.kratai.openPath(joinPath(workspacePath, filePath));
				}
				break;
			}

			case 'saveAsMD': {
				const diagramName = (message.diagramName as string) || 'diagram';
				await window.kratai.exportMarkdown(workspacePath, diagramName);
				await refreshSidebar();
				break;
			}

			case 'openSettings': {
				if (currentDiagramViewId) {
					await openConfigPanel('edit', currentDiagramViewId);
				} else {
					await openConfigPanel('create');
				}
				break;
			}

			case 'save': {
				if (!currentConfigPanel) break;
				const newConfig = {
					selectedFolders: message.selectedFolders,
					folders: message.folders,
					selectedExtensions: message.selectedExtensions,
					respectGitignore: currentConfigPanel.config?.respectGitignore,
					followSymlinks: currentConfigPanel.config?.followSymlinks,
					classTypeFilters: message.classTypeFilters,
					relationshipTypeFilters: message.relationshipTypeFilters,
					gitDiff: message.gitDiff
				};
				const diagramName = (message.diagramName as string) || currentConfigPanel.diagramName;

				const { viewId } = await window.kratai.saveViewConfig(workspacePath, {
					mode: currentConfigPanel.mode,
					viewId: currentConfigPanel.viewId,
					diagramName,
					config: newConfig
				});

				await refreshSidebar();

				if (message.generateDiagram) {
					await openDiagram(viewId);
				} else {
					showEmpty();
				}
				break;
			}

			case 'delete': {
				if (currentConfigPanel?.viewId) {
					await window.kratai.deleteView(workspacePath, currentConfigPanel.viewId);
					await refreshSidebar();
					showEmpty();
				}
				break;
			}
		}
	})();
});

async function init(): Promise<void> {
	const recents = await window.kratai.listRecentWorkspaces();
	if (recents.length > 0) {
		await setWorkspace(recents[0]);
	}
}

void init();
