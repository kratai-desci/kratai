import { Network, Plus } from 'lucide-react';
import Link from 'next/link';

import type { WebDiagramView } from '@/2_domain';
import { Button } from '@/components/ui/button';

import { ViewCard } from './ViewCard';

export function ViewList({ views }: { views: WebDiagramView[] }) {
	if (views.length === 0) {
		return (
			<div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line py-16 text-center">
				<div className="flex size-12 items-center justify-center rounded-full bg-brand/15 text-brand-ink">
					<Network className="size-6" />
				</div>
				<div>
					<h2 className="font-semibold text-ink">Create your first diagram</h2>
					<p className="mt-1 text-sm text-ink-2">
						Pick a repo and branch to generate an interactive architecture diagram.
					</p>
				</div>
				<Button asChild>
					<Link href="/new">
						<Plus className="size-4" />
						Create your first diagram
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{views.map((view) => (
				<ViewCard key={view.id} view={view} />
			))}
		</div>
	);
}
