import type { Branch } from '../entities/Branch';
import type { Repo } from '../entities/Repo';
import type { User } from '../entities/User';

/**
 * Contract for everything sourced from GitHub: the signed-in user's
 * profile, and the repos/branches they can pick a diagram from.
 * 3_infrastructure provides the implementations (mock today, a real
 * GitHub API client + OAuth session later).
 */
export interface GitHubRepository {
	getCurrentUser(): Promise<User>;
	listRepos(): Promise<Repo[]>;
	getRepo(fullName: string): Promise<Repo | undefined>;
	listBranches(repoFullName: string): Promise<Branch[]>;
}
