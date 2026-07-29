import type { CreateViewInput, ViewRepository, WebDiagramView } from '@/2_domain';

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

	async listViews(filter?: { repoFullName?: string; branch?: string }): Promise<WebDiagramView[]> {
		return this.store
			.filter((v) => !filter?.repoFullName || v.repoFullName === filter.repoFullName)
			.filter((v) => !filter?.branch || v.branch === filter.branch)
			.sort((a, b) => (b.lastGenerated ?? b.createdAt).localeCompare(a.lastGenerated ?? a.createdAt));
	}

	async getView(id: string): Promise<WebDiagramView | undefined> {
		return this.store.find((v) => v.id === id);
	}

	async createView(input: CreateViewInput): Promise<WebDiagramView> {
		const view: WebDiagramView = {
			id: makeId(),
			repoFullName: input.repoFullName,
			branch: input.branch,
			name: input.name,
			config: input.config,
			createdAt: new Date().toISOString(),
			lastGenerated: new Date().toISOString(),
		};
		this.store.push(view);
		return view;
	}

	async updateView(
		id: string,
		updates: Partial<Pick<WebDiagramView, 'name' | 'config'>>
	): Promise<WebDiagramView | undefined> {
		const view = this.store.find((v) => v.id === id);
		if (!view) return undefined;
		Object.assign(view, updates, { lastGenerated: new Date().toISOString() });
		return view;
	}

	async deleteView(id: string): Promise<void> {
		const index = this.store.findIndex((v) => v.id === id);
		if (index !== -1) this.store.splice(index, 1);
	}
}
