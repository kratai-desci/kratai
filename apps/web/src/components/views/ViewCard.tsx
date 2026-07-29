'use client';

import { GitBranch, MoreVertical, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteViewAction } from '@/lib/data/actions';
import type { WebDiagramView } from '@/lib/data/types';

export function ViewCard({ view }: { view: WebDiagramView }) {
	const router = useRouter();
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	function handleDelete() {
		startTransition(async () => {
			await deleteViewAction(view.id);
			setConfirmOpen(false);
			router.refresh();
		});
	}

	return (
		<>
			<Card className="flex flex-col gap-3">
				<div className="flex items-start justify-between gap-2">
					<Link href={`/diagrams/${view.id}`} className="min-w-0">
						<h3 className="truncate text-base font-semibold text-ink hover:text-brand-ink">
							{view.name}
						</h3>
					</Link>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" aria-label="View actions">
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link href={`/configure?viewId=${view.id}`}>
									<Settings className="size-3.5" />
									Edit config
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-danger-2 data-[highlighted]:text-danger-2"
								onSelect={() => setConfirmOpen(true)}
							>
								<Trash2 className="size-3.5" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<p className="truncate text-sm text-ink-2">{view.repoFullName}</p>

				<div className="flex items-center gap-2 text-xs text-ink-3">
					<Badge variant="neutral">
						<GitBranch className="mr-1 size-3" />
						{view.branch}
					</Badge>
					<span>Updated {new Date(view.lastGenerated ?? view.createdAt).toLocaleDateString()}</span>
				</div>
			</Card>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete &quot;{view.name}&quot;?</DialogTitle>
						<DialogDescription>
							This removes the saved diagram configuration. This can&apos;t be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="secondary" onClick={() => setConfirmOpen(false)}>
							Cancel
						</Button>
						<Button variant="danger" onClick={handleDelete} disabled={isPending}>
							{isPending ? 'Deleting...' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
