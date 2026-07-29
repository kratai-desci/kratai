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
