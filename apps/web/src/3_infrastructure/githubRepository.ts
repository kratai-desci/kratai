import type { GitHubRepository } from '@/2_domain';

import { MockGitHubRepository } from './mock/MockGitHubRepository';

// Composition point: picks the active GitHubRepository implementation.
// Always the mock today - a real GitHub API client (+ OAuth session) joins
// MockGitHubRepository here later, selected e.g. by env var.
export const githubRepository: GitHubRepository = new MockGitHubRepository();
