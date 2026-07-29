import { MOCK_BRANCHES, MOCK_REPOS } from './mock/repos';
import * as mockViews from './mock/views';
import type { Branch, Repo, WebDiagramView } from './types';

export type { Branch, CreateViewInput, Repo, WebDiagramView } from './types';
export { DEFAULT_CONFIG } from './mock/views';

/**
 * Read-side data access, used from Server Components. Phase 2 swaps these
 * implementations for real GitHub API / MongoDB Atlas calls - callers don't
 * change.
 */

export async function listRepos(): Promise<Repo[]> {
	return MOCK_REPOS;
}

export async function getRepo(fullName: string): Promise<Repo | undefined> {
	return MOCK_REPOS.find((r) => r.fullName === fullName);
}

export async function listBranches(repoFullName: string): Promise<Branch[]> {
	return MOCK_BRANCHES[repoFullName] ?? [];
}

export async function listViews(filter?: {
	repoFullName?: string;
	branch?: string;
}): Promise<WebDiagramView[]> {
	return mockViews.listViews(filter);
}

export async function getView(id: string): Promise<WebDiagramView | undefined> {
	return mockViews.getView(id);
}
