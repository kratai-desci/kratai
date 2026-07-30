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
