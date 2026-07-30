import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import { getPlanStatus } from '@/1_application/plan';
import { listRepos } from '@/1_application/queries';
import { NewDiagramFlow } from '@/components/repo/NewDiagramFlow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default async function NewDiagramPage() {
	const status = await getPlanStatus();

	if (status.atLimit) {
		return (
			<div className="mx-auto max-w-2xl">
				<h1 className="mb-8 text-3xl font-semibold text-ink">New Diagram</h1>
				<Card className="flex flex-col items-center gap-4 py-10 text-center hover:border-line hover:shadow-none">
					<Sparkles className="size-8 text-brand-ink" />
					<div>
						<p className="text-lg font-semibold text-ink">
							You&apos;ve reached the Free plan limit
						</p>
						<p className="mt-1 text-sm text-ink-2">
							Free includes {status.limit} saved diagram. Delete your existing one, or upgrade to
							Pro for unlimited diagrams.
						</p>
					</div>
					<Button asChild>
						<Link href="/pricing">View plans</Link>
					</Button>
				</Card>
			</div>
		);
	}

	const repos = await listRepos();

	return (
		<div className="mx-auto max-w-2xl">
			<h1 className="mb-8 text-3xl font-semibold text-ink">New Diagram</h1>
			<NewDiagramFlow repos={repos} />
		</div>
	);
}
