import type { KrataiConfig } from '@kratai/core';

import type { CreateViewInput, WebDiagramView } from '../types';

export const DEFAULT_CONFIG: KrataiConfig = {
	selectedFolders: [],
	selectedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.php', '.html'],
	respectGitignore: true,
	classTypeFilters: {},
	relationshipTypeFilters: {},
	detectHttpCalls: true,
	frameworkEnrichment: true,
};

function makeId(): string {
	return `view_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Module-level in-memory store - resets on server restart, which is fine
// for a UI-only phase with no real persistence yet. Seeded with one example
// so /dashboard isn't empty on first load.
const store: WebDiagramView[] = [
	{
		id: 'view_seed_core',
		repoFullName: 'kratai-desci/kratai',
		branch: 'main',
		name: 'Diagram Pipeline',
		config: DEFAULT_CONFIG,
		createdAt: '2026-07-24T06:19:00Z',
		lastGenerated: '2026-07-28T15:40:26Z',
	},
];

export function listViews(filter?: { repoFullName?: string; branch?: string }): WebDiagramView[] {
	return store
		.filter((v) => !filter?.repoFullName || v.repoFullName === filter.repoFullName)
		.filter((v) => !filter?.branch || v.branch === filter.branch)
		.sort((a, b) => (b.lastGenerated ?? b.createdAt).localeCompare(a.lastGenerated ?? a.createdAt));
}

export function getView(id: string): WebDiagramView | undefined {
	return store.find((v) => v.id === id);
}

export function createView(input: CreateViewInput): WebDiagramView {
	const view: WebDiagramView = {
		id: makeId(),
		repoFullName: input.repoFullName,
		branch: input.branch,
		name: input.name,
		config: input.config,
		createdAt: new Date().toISOString(),
		lastGenerated: new Date().toISOString(),
	};
	store.push(view);
	return view;
}

export function updateView(
	id: string,
	updates: Partial<Pick<WebDiagramView, 'name' | 'config'>>
): WebDiagramView | undefined {
	const view = store.find((v) => v.id === id);
	if (!view) return undefined;
	Object.assign(view, updates, { lastGenerated: new Date().toISOString() });
	return view;
}

export function deleteView(id: string): void {
	const index = store.findIndex((v) => v.id === id);
	if (index !== -1) store.splice(index, 1);
}
