import type { CreateViewInput, ViewRepository, WebDiagramView } from '@/2_domain';
import type { KrataiConfig } from '@kratai/core';

function makeId(): string {
	return `view_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Infrastructure must not depend on 1_application (that would create a
// cycle: application -> infrastructure -> application), so the seed
// view's config is its own literal rather than an import of
// 1_application/config.ts's DEFAULT_CONFIG - they happen to agree today by
// construction, not by a shared reference.
const SEED_CONFIG: KrataiConfig = {
	selectedFolders: [],
	selectedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.php', '.html'],
	respectGitignore: true,
	classTypeFilters: {},
	relationshipTypeFilters: {},
	detectHttpCalls: true,
	frameworkEnrichment: true,
};

/**
 * In-memory implementation of ViewRepository - resets on server restart,
 * which is fine for a UI-only phase with no real persistence yet. Seeded
 * with one example so /dashboard isn't empty on first load. Swapped for a
 * MongoDB Atlas-backed implementation later, behind the same interface.
 */
export class MockViewRepository implements ViewRepository {
	private store: WebDiagramView[] = [
		{
			id: 'view_seed_core',
			repoFullName: 'sample-dev/architecture-tool',
			branch: 'main',
			name: 'Diagram Pipeline',
			config: SEED_CONFIG,
			createdAt: '2026-07-24T06:19:00Z',
			lastGenerated: '2026-07-28T15:40:26Z',
		},
	];

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
