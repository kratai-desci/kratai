import type { CreateViewInput, ViewRepository, WebDiagramView } from '@/2_domain';
import type { DiagramData } from '@kratai/core';

const STUCK_GENERATING_MS = 5 * 60 * 1000;

function makeId(): string {
	return `view_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * In-memory implementation of ViewRepository - resets on server restart,
 * which is fine for a UI-only phase with no real persistence yet. Starts
 * empty; ViewList already renders a "No diagrams yet" state for that.
 * Swapped for a MongoDB Atlas-backed implementation later, behind the
 * same interface.
 */
export class MockViewRepository implements ViewRepository {
	private store: WebDiagramView[] = [];

	async listViews(
		userId: string,
		filter?: { repoFullName?: string; branch?: string }
	): Promise<WebDiagramView[]> {
		return this.store
			.filter((v) => v.userId === userId)
			.filter((v) => !filter?.repoFullName || v.repoFullName === filter.repoFullName)
			.filter((v) => !filter?.branch || v.branch === filter.branch)
			.map(({ diagramData: _diagramData, ...rest }) => rest)
			.sort((a, b) => (b.lastGenerated ?? b.createdAt).localeCompare(a.lastGenerated ?? a.createdAt));
	}

	async getView(id: string, userId: string): Promise<WebDiagramView | undefined> {
		return this.store.find((v) => v.id === id && v.userId === userId);
	}

	async createView(userId: string, input: CreateViewInput): Promise<WebDiagramView> {
		const view: WebDiagramView = {
			id: makeId(),
			userId,
			repoFullName: input.repoFullName,
			branch: input.branch,
			name: input.name,
			config: input.config,
			createdAt: new Date().toISOString(),
			status: 'idle',
		};
		this.store.push(view);
		return view;
	}

	async updateView(
		id: string,
		userId: string,
		updates: Partial<Pick<WebDiagramView, 'name' | 'config'>>
	): Promise<WebDiagramView | undefined> {
		const view = this.store.find((v) => v.id === id && v.userId === userId);
		if (!view) return undefined;
		Object.assign(view, updates, {
			status: 'idle',
			diagramData: undefined,
			commitSha: undefined,
			lastError: undefined,
			generatingSince: undefined,
		});
		return view;
	}

	async deleteView(id: string, userId: string): Promise<void> {
		const index = this.store.findIndex((v) => v.id === id && v.userId === userId);
		if (index !== -1) this.store.splice(index, 1);
	}

	async beginGeneration(id: string, userId: string): Promise<WebDiagramView | undefined> {
		const view = this.store.find((v) => v.id === id && v.userId === userId);
		if (!view) return undefined;

		const stuck =
			view.status === 'generating' &&
			view.generatingSince != null &&
			Date.now() - Date.parse(view.generatingSince) > STUCK_GENERATING_MS;
		if (view.status === 'generating' && !stuck) return undefined;

		view.status = 'generating';
		view.generatingSince = new Date().toISOString();
		return view;
	}

	async completeGeneration(
		id: string,
		userId: string,
		result: { diagramData: DiagramData; commitSha: string }
	): Promise<WebDiagramView | undefined> {
		const view = this.store.find((v) => v.id === id && v.userId === userId);
		if (!view) return undefined;

		view.status = 'ready';
		view.diagramData = result.diagramData;
		view.commitSha = result.commitSha;
		view.lastGenerated = new Date().toISOString();
		view.generatingSince = undefined;
		view.lastError = undefined;
		return view;
	}

	async failGeneration(id: string, userId: string, errorMessage: string): Promise<WebDiagramView | undefined> {
		const view = this.store.find((v) => v.id === id && v.userId === userId);
		if (!view) return undefined;

		// A failed *re*generation keeps the last good data instead of
		// blanking a working view - only a failed first-ever generation
		// really has nothing to fall back to.
		view.status = view.diagramData ? 'ready' : 'failed';
		view.lastError = errorMessage;
		view.generatingSince = undefined;
		return view;
	}
}
