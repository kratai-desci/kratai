import { MOCK_BRANCHES, MOCK_REPOS } from './mock/repos';
import { MOCK_USER } from './mock/user';
import * as mockViews from './mock/views';
import type { Branch, Repo, User, WebDiagramView } from './types';

export type { Branch, CreateViewInput, Repo, User, WebDiagramView } from './types';
export { DEFAULT_CONFIG } from './mock/views';

/**
 * There's no real session in this UI-only phase (see REQUIREMENTS.md
 * §4.1) - every page under the (app) route group is treated as this one
 * signed-in mock user. Phase 2 replaces this with the real Auth.js/GitHub
 * OAuth session.
 */
export async function getCurrentUser(): Promise<User> {
	return MOCK_USER;
}

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
