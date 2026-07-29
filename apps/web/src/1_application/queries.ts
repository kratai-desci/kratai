import type { Branch, Repo, User, WebDiagramView } from '@/2_domain';
import { getGitHubRepository } from '@/3_infrastructure/githubRepository';
import { viewRepository } from '@/3_infrastructure/viewRepository';

/**
 * Read-side use cases, called from Server Components. Depend only on the
 * domain-typed repository instances from 3_infrastructure - swapping mock
 * for real GitHub API / MongoDB Atlas implementations there doesn't
 * require any change here. getGitHubRepository() is async (unlike
 * viewRepository) because which implementation applies depends on the
 * current request's session.
 */

export async function getCurrentUser(): Promise<User> {
	const github = await getGitHubRepository();
	return github.getCurrentUser();
}

export async function listRepos(): Promise<Repo[]> {
	const github = await getGitHubRepository();
	return github.listRepos();
}

export async function getRepo(fullName: string): Promise<Repo | undefined> {
	const github = await getGitHubRepository();
	return github.getRepo(fullName);
}

export async function listBranches(repoFullName: string): Promise<Branch[]> {
	const github = await getGitHubRepository();
	return github.listBranches(repoFullName);
}

export async function listViews(filter?: {
	repoFullName?: string;
	branch?: string;
}): Promise<WebDiagramView[]> {
	return viewRepository.listViews(filter);
}

export async function getView(id: string): Promise<WebDiagramView | undefined> {
	return viewRepository.getView(id);
}
