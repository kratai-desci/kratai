import type { Branch, GitHubRepository, Repo, User } from '@/2_domain';

const GITHUB_API = 'https://api.github.com';

interface GitHubApiRepo {
	id: number;
	name: string;
	full_name: string;
	description: string | null;
	default_branch: string;
	private: boolean;
	updated_at: string;
	owner: { login: string };
}

interface GitHubApiBranch {
	name: string;
}

/**
 * Real GitHubRepository implementation, backed by the GitHub REST API and
 * the signed-in user's OAuth access token. Constructed fresh per request
 * (see 3_infrastructure/githubRepository.ts) - unlike MockGitHubRepository,
 * it can't be a module-level singleton, since the token and profile are
 * specific to whoever is currently signed in.
 */
export class GitHubApiRepository implements GitHubRepository {
	constructor(
		private readonly accessToken: string,
		private readonly currentUser: User
	) {}

	private async fetchJson<T>(path: string): Promise<T> {
		const res = await fetch(`${GITHUB_API}${path}`, {
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				Accept: 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28',
			},
		});
		if (!res.ok) {
			throw new Error(`GitHub API request failed: ${res.status} ${res.statusText} (${path})`);
		}
		return res.json() as Promise<T>;
	}

	async getCurrentUser(): Promise<User> {
		return this.currentUser;
	}

	async listRepos(): Promise<Repo[]> {
		const repos = await this.fetchJson<GitHubApiRepo[]>(
			'/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member'
		);
		return repos.map(toRepo);
	}

	async getRepo(fullName: string): Promise<Repo | undefined> {
		try {
			const repo = await this.fetchJson<GitHubApiRepo>(`/repos/${fullName}`);
			return toRepo(repo);
		} catch {
			return undefined;
		}
	}

	async listBranches(repoFullName: string, defaultBranch: string): Promise<Branch[]> {
		const branches = await this.fetchJson<GitHubApiBranch[]>(
			`/repos/${repoFullName}/branches?per_page=100`
		);
		return branches.map((b) => ({ name: b.name, isDefault: b.name === defaultBranch }));
	}
}

function toRepo(repo: GitHubApiRepo): Repo {
	return {
		id: String(repo.id),
		owner: repo.owner.login,
		name: repo.name,
		fullName: repo.full_name,
		description: repo.description ?? '',
		defaultBranch: repo.default_branch,
		private: repo.private,
		updatedAt: repo.updated_at,
	};
}
