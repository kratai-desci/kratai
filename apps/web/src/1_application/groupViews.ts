import type { WebDiagramView } from '@/2_domain';

export interface DiagramGroup {
	key: string;
	repoFullName: string;
	branch: string;
	views: WebDiagramView[];
}

/**
 * Flat groups keyed by repo+branch (no repo > branch nesting) - each group
 * header shows both, sorted alphabetically by repo then branch. Views
 * within a group are sorted most-recent-first.
 */
export function groupViewsByRepoAndBranch(views: WebDiagramView[]): DiagramGroup[] {
	const groups = new Map<string, DiagramGroup>();

	for (const view of views) {
		const key = `${view.repoFullName}::${view.branch}`;
		let group = groups.get(key);
		if (!group) {
			group = { key, repoFullName: view.repoFullName, branch: view.branch, views: [] };
			groups.set(key, group);
		}
		group.views.push(view);
	}

	for (const group of groups.values()) {
		group.views.sort((a, b) => (b.lastGenerated ?? b.createdAt).localeCompare(a.lastGenerated ?? a.createdAt));
	}

	return [...groups.values()].sort(
		(a, b) => a.repoFullName.localeCompare(b.repoFullName) || a.branch.localeCompare(b.branch)
	);
}
