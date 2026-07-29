import type { GitHubRepository, User } from '@/2_domain';

import { auth, isGitHubOAuthConfigured } from './auth';
import { GitHubApiRepository } from './github/GitHubApiRepository';
import { MockGitHubRepository } from './mock/MockGitHubRepository';

const mockGitHubRepository = new MockGitHubRepository();

/**
 * Composition point: picks the active GitHubRepository implementation.
 * Unlike viewRepository/diagramSource, this can't be a fixed module-level
 * singleton - the real implementation needs the current request's
 * signed-in user and OAuth access token, so it's constructed fresh per
 * call. Falls back to the mock whenever there's no authenticated session -
 * and skips calling auth() at all when OAuth isn't configured, since
 * Auth.js validates its config (and complains about a missing AUTH_SECRET)
 * on every call regardless of whether the request actually needs a session.
 */
export async function getGitHubRepository(): Promise<GitHubRepository> {
	if (!isGitHubOAuthConfigured()) {
		return mockGitHubRepository;
	}

	const session = await auth();
	if (!session?.accessToken) {
		return mockGitHubRepository;
	}

	const user: User = {
		id: session.user.id ?? '',
		name: session.user.name ?? session.user.username ?? 'GitHub user',
		username: session.user.username ?? '',
		email: session.user.email ?? '',
		avatarUrl: session.user.image ?? null,
	};

	return new GitHubApiRepository(session.accessToken, user);
}
