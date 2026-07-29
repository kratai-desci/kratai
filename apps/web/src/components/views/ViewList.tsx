import type { WebDiagramView } from '@/2_domain';

import { ViewCard } from './ViewCard';

export function ViewList({ views }: { views: WebDiagramView[] }) {
	if (views.length === 0) {
		return (
			<div className="rounded-lg border border-dashed border-line py-16 text-center text-ink-3">
				No diagrams yet. Create one to get started.
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
