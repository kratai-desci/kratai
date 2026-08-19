export function githubFileUrl(
	repoFullName: string,
	branch: string,
	filePath: string,
	startLine?: number,
	endLine?: number
): string {
	const base = `https://github.com/${repoFullName}/blob/${branch}/${filePath}`;
	if (!startLine) return base;
	const hash = endLine && endLine !== startLine ? `#L${startLine}-L${endLine}` : `#L${startLine}`;
	return base + hash;
}

export function githubCommitUrl(repoFullName: string, commitSha: string): string {
	return `https://github.com/${repoFullName}/commit/${commitSha}`;
}

/** Short form (e.g. "a1b2c3d") for compact display - GitHub accepts any unambiguous prefix in URLs. */
export function shortSha(commitSha: string): string {
	return commitSha.slice(0, 7);
}

// GitHub's own username/repo charset: alphanumeric plus single hyphens for
// usernames (can't start/end with one), and a wider [\w.-] set for repo
// names. Deliberately strict rather than permissive - this feeds straight
// into a `git clone` URL (see PublicGitCloneSource), so rejecting anything
// that isn't a plausible owner/repo pair here is cheaper and safer than
// trying to sanitize it later.
const OWNER = '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})';
const REPO = '[\\w.-]{1,100}';
const REPO_INPUT_RE = new RegExp(`^${OWNER}/${REPO}$`);

/**
 * Parses free-form user input - a bare "owner/repo", a full GitHub URL, or
 * either with a trailing "/" or ".git" - down to a normalized "owner/repo"
 * string. Returns null for anything that doesn't resolve to that shape
 * (multi-segment paths like a specific file/branch URL are rejected rather
 * than guessed at, since the "try a public repo" flow only ever wants the
 * repo root).
 */
export function parseRepoInput(input: string): string | null {
	let value = input.trim();
	if (!value) return null;

	value = value.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
	value = value.replace(/\/+$/, '').replace(/\.git$/i, '');

	return REPO_INPUT_RE.test(value) ? value : null;
}
