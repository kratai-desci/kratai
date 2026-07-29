import { NewDiagramFlow } from '@/components/repo/NewDiagramFlow';
import type { Branch } from '@/lib/data/types';
import { listBranches, listRepos } from '@/lib/data';

export default async function NewDiagramPage() {
	const repos = await listRepos();
	const branchesByRepo: Record<string, Branch[]> = {};
	for (const repo of repos) {
		branchesByRepo[repo.fullName] = await listBranches(repo.fullName);
	}

	return (
		<div className="mx-auto max-w-2xl">
			<h1 className="mb-8 text-3xl font-semibold text-ink">New Diagram</h1>
			<NewDiagramFlow repos={repos} branchesByRepo={branchesByRepo} />
		</div>
	);
}
