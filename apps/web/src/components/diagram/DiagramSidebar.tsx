'use client';

import { GitBranch, GitCommitHorizontal, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { groupViewsByRepoAndBranch } from '@/1_application/groupViews';
import { githubCommitUrl, shortSha } from '@/1_application/githubUrls';
import type { WebDiagramView } from '@/2_domain';
import { cn } from '@/lib/utils';

export function DiagramSidebar({ views }: { views: WebDiagramView[] }) {
	const pathname = usePathname();
	const groups = groupViewsByRepoAndBranch(views);

	return (
		<aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface-2">
			<div className="flex items-center justify-between border-b border-line px-4 py-3">
				<Link href="/dashboard" className="text-sm font-medium text-ink-2 hover:text-brand-ink">
					← Dashboard
				</Link>
				<Link
					href="/new"
					className="rounded-md p-1 text-ink-3 transition-colors hover:bg-surface hover:text-brand-ink"
					aria-label="New diagram"
				>
					<Plus className="size-4" />
				</Link>
			</div>

			<nav className="flex-1 overflow-y-auto px-2 py-3">
				{groups.length === 0 && <p className="px-2 text-sm text-ink-3">No diagrams yet.</p>}

				{groups.map((group) => (
					<div key={group.key} className="mb-4">
						<div className="mb-1.5 px-2">
							<p className="truncate text-xs font-semibold text-ink-2">{group.repoFullName}</p>
							<p className="flex items-center gap-1 text-[11px] text-ink-3">
								<GitBranch className="size-2.5 shrink-0" />
								<span className="truncate">{group.branch}</span>
							</p>
						</div>
						<ul className="flex flex-col gap-0.5">
							{group.views.map((view) => {
								const href = `/diagrams/${view.id}`;
								const isActive = pathname === href;
								return (
									<li
										key={view.id}
										className={cn(
											'flex items-center justify-between gap-2 rounded-md px-2 text-sm transition-colors',
											isActive
												? 'bg-brand/15 text-brand-ink'
												: 'text-ink-2 hover:bg-surface hover:text-ink'
										)}
									>
										<Link href={href} className="min-w-0 flex-1 truncate py-1.5">
											{view.name}
										</Link>
										{view.commitSha && (
											<a
												href={githubCommitUrl(view.repoFullName, view.commitSha)}
												target="_blank"
												rel="noreferrer"
												title={view.commitSha}
												className="flex shrink-0 items-center gap-0.5 font-mono text-[10px] text-ink-3 hover:text-brand-ink hover:underline"
											>
												<GitCommitHorizontal className="size-2.5" />
												{shortSha(view.commitSha)}
											</a>
										)}
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</nav>
		</aside>
	);
}
