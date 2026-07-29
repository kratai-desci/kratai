import { listRepos } from '@/1_application/queries';
import { NewDiagramFlow } from '@/components/repo/NewDiagramFlow';

export default async function NewDiagramPage() {
	const repos = await listRepos();

	return (
		<div className="mx-auto max-w-2xl">
			<h1 className="mb-8 text-3xl font-semibold text-ink">New Diagram</h1>
			<NewDiagramFlow repos={repos} />
		</div>
	);
}
