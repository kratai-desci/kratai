import type { Branch, GitHubRepository, Repo, User } from '@/2_domain';

// All fictional - none of these link to a real GitHub repo. The seeded
// diagram's fixture data (3_infrastructure/fixtures/sample-diagram.json)
// was parsed from real local source, but "open file"/"open member" links
// are built from whatever repoFullName/branch the view has, so they don't
// resolve to anything for this mock repo (same as the other two below).
// Selecting any of these still renders the same demo diagram since there's
// no real clone/parse pipeline yet.
const MOCK_USER: User = {
	id: 'user_demo',
	name: 'Alex Rivera',
	username: 'alexrivera',
	email: 'alex@example.com',
	avatarUrl: null,
};

const MOCK_REPOS: Repo[] = [
	{
		id: 'repo_sample',
		owner: 'sample-dev',
		name: 'architecture-tool',
		fullName: 'sample-dev/architecture-tool',
		description: 'Sample repo used for the seeded demo diagram.',
		defaultBranch: 'main',
		private: false,
		updatedAt: '2026-07-24T06:19:00Z',
	},
	{
		id: 'repo_storefront',
		owner: 'acme-corp',
		name: 'storefront',
		fullName: 'acme-corp/storefront',
		description: 'Next.js storefront frontend.',
		defaultBranch: 'main',
		private: true,
		updatedAt: '2026-07-20T14:02:00Z',
	},
	{
		id: 'repo_blog',
		owner: 'jane-doe',
		name: 'personal-blog',
		fullName: 'jane-doe/personal-blog',
		description: 'A small Django blog.',
		defaultBranch: 'master',
		private: false,
		updatedAt: '2026-06-30T09:45:00Z',
	},
];

const MOCK_BRANCHES: Record<string, Branch[]> = {
	'sample-dev/architecture-tool': [
		{ name: 'main', isDefault: true },
		{ name: 'develop', isDefault: false },
	],
	'acme-corp/storefront': [
		{ name: 'main', isDefault: true },
		{ name: 'develop', isDefault: false },
		{ name: 'feature/checkout-redesign', isDefault: false },
	],
	'jane-doe/personal-blog': [{ name: 'master', isDefault: true }],
};

/**
 * Mock implementation of GitHubRepository - no network calls, no session.
 * Swapped for a real GitHub API client + OAuth session later, behind the
 * same interface.
 */
export class MockGitHubRepository implements GitHubRepository {
	async getCurrentUser(): Promise<User> {
		return MOCK_USER;
	}

	async listRepos(): Promise<Repo[]> {
		return MOCK_REPOS;
	}

	async getRepo(fullName: string): Promise<Repo | undefined> {
		return MOCK_REPOS.find((r) => r.fullName === fullName);
	}

	async listBranches(repoFullName: string): Promise<Branch[]> {
		return MOCK_BRANCHES[repoFullName] ?? [];
	}
}
