import 'server-only';

import type { DiagramSourceRepository } from '@/2_domain';

import { auth, isGitHubOAuthConfigured } from './auth';
import { GitCloneDiagramSource } from './clone/GitCloneDiagramSource';
import { MockDiagramSource } from './mock/MockDiagramSource';

const mockDiagramSource = new MockDiagramSource();

/**
 * Composition point: picks the active DiagramSourceRepository
 * implementation. Same shape as githubRepository.ts - can't be a fixed
 * module-level singleton, since the real implementation needs the current
 * request's OAuth access token to clone the (possibly private) repo.
 * Falls back to the mock whenever there's no authenticated session
 * (including when GitHub OAuth isn't configured at all).
 */
export async function getDiagramSource(): Promise<DiagramSourceRepository> {
	if (!isGitHubOAuthConfigured()) {
		return mockDiagramSource;
	}

	const session = await auth();
	if (!session?.accessToken) {
		return mockDiagramSource;
	}

	return new GitCloneDiagramSource(session.accessToken);
}
