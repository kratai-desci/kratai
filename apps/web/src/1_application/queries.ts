import type { Branch, Repo, User, WebDiagramView } from '@/2_domain';
import { githubRepository } from '@/3_infrastructure/githubRepository';
import { viewRepository } from '@/3_infrastructure/viewRepository';

/**
 * Read-side use cases, called from Server Components. Depend only on the
 * domain-typed repository instances from 3_infrastructure - swapping mock
 * for real GitHub API / MongoDB Atlas implementations there doesn't
 * require any change here.
 */

export async function getCurrentUser(): Promise<User> {
	return githubRepository.getCurrentUser();
}

export async function listRepos(): Promise<Repo[]> {
	return githubRepository.listRepos();
}

export async function getRepo(fullName: string): Promise<Repo | undefined> {
	return githubRepository.getRepo(fullName);
}

export async function listBranches(repoFullName: string): Promise<Branch[]> {
	return githubRepository.listBranches(repoFullName);
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
