import { Plus } from 'lucide-react';
import Link from 'next/link';

import { ViewList } from '@/components/views/ViewList';
import { Button } from '@/components/ui/button';
import { listViews } from '@/lib/data';

export default async function DashboardPage() {
	const views = await listViews();

	return (
		<div className="flex flex-col gap-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold text-ink">Your diagrams</h1>
					<p className="mt-1 text-sm text-ink-2">
						Saved architecture diagrams across your repos.
					</p>
				</div>
				<Button asChild>
					<Link href="/new">
						<Plus className="size-4" />
						New Diagram
					</Link>
				</Button>
			</div>

			<ViewList views={views} />
		</div>
	);
}
