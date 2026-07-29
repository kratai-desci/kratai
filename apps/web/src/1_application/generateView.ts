import 'server-only';

import type { WebDiagramView } from '@/2_domain';
import { getDiagramSource } from '@/3_infrastructure/diagramSource';
import { getGitHubRepository } from '@/3_infrastructure/githubRepository';
import { viewRepository } from '@/3_infrastructure/viewRepository';

import { getCurrentUser } from './queries';

/**
 * Runs the actual clone+parse for a view and persists the result, guarded
 * by ViewRepository's atomic status transition so at most one generation
 * runs per view at a time - this can't be an in-process lock, since Cloud
 * Run may run multiple instances that wouldn't see each other's lock.
 *
 * Safe to call speculatively whenever a view might need (re)generating: if
 * another request already holds the lock, this is a no-op that returns the
 * view's current state instead of starting a second worker - callers
 * render whatever status comes back (typically 'generating') rather than
 * assuming this call always performs work.
 */
export async function generateAndCacheView(view: WebDiagramView): Promise<WebDiagramView> {
	const user = await getCurrentUser();
	const locked = await viewRepository.beginGeneration(view.id, user.id);
	if (!locked) {
		return (await viewRepository.getView(view.id, user.id)) ?? view;
	}

	try {
		const source = await getDiagramSource();
		const { diagramData, commitSha } = await source.getDiagramData(
			view.repoFullName,
			view.branch,
			view.config
		);
		const completed = await viewRepository.completeGeneration(view.id, user.id, { diagramData, commitSha });
		return completed ?? locked;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const failed = await viewRepository.failGeneration(view.id, user.id, message);
		return failed ?? locked;
	}
}

/**
 * Whether a ready view's cached data is behind the branch's current head.
 * Computed live on every call rather than stored, so there's nothing to
 * keep in sync - just one lightweight GitHub API call. Returns false (not
 * stale) when the branch can't be resolved, so a rename/deletion never
 * blocks viewing an existing cached diagram.
 */
export async function isViewStale(view: WebDiagramView): Promise<boolean> {
	if (!view.commitSha) return false;

	const github = await getGitHubRepository();
	const headSha = await github.getBranchHeadSha(view.repoFullName, view.branch);
	if (!headSha) return false;

	return headSha !== view.commitSha;
}
