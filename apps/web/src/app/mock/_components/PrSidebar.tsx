'use client';

import { AlertTriangle, CheckCircle2, GitBranch, GitPullRequest, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

import { getMockRepo, mockPrHref, mockSettingsHref } from '@/app/mock/_data';

// Repo-scoped PR browsing sidebar, used by every /mock/repo/[repo]/* page
// (diagram view, settings, PR detail) in place of the real DiagramSidebar's
// cross-repo diagram-view list - browsing between this repo's PRs is more
// useful here than a list of saved diagram views. This sidebar is itself
// the PR list for the repo, so there's no separate pulls page to link back
// to; the "Detection rules" footer link is a temporary placement until the
// real settings pages get refactored.
export function PrSidebar({ repo }: { repo: string }) {
	const pathname = usePathname();
	const repoData = getMockRepo(repo);
	const pulls = repoData?.pulls ?? [];

	return (
		<aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface-2">
			<div className="border-b border-line px-4 py-3">
				<Link href="/mock/dashboard" className="text-sm font-medium text-ink-2 hover:text-brand-ink">
					← Dashboard
				</Link>
				<p className="mt-2 truncate text-xs font-semibold text-ink-2">{repo}</p>
				{repoData && (
					<p className="flex items-center gap-1 text-[11px] text-ink-3">
						<GitBranch className="size-2.5 shrink-0" />
						<span className="truncate">{repoData.branch}</span>
					</p>
				)}
			</div>

			<nav className="flex-1 overflow-y-auto px-2 py-3">
				{pulls.length === 0 && <p className="px-2 text-sm text-ink-3">No pull requests.</p>}
				<ul className="flex flex-col gap-0.5">
					{pulls.map((pr) => {
						const href = mockPrHref(repo, pr.number);
						const isActive = pathname === href;
						return (
							<li key={pr.number}>
								<Link
									href={href}
									className={cn(
										'flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
										isActive
											? 'bg-brand/15 text-brand-ink'
											: 'text-ink-2 hover:bg-surface hover:text-ink'
									)}
								>
									<GitPullRequest className="mt-0.5 size-3.5 shrink-0" />
									<span className="min-w-0 flex-1">
										<span className="block truncate">
											<span className={isActive ? 'text-brand-ink/70' : 'text-ink-3'}>#{pr.number}</span>{' '}
											{pr.title}
										</span>
										{pr.flagged ? (
											<span className="flex items-center gap-1 text-[11px] text-warning-2">
												<AlertTriangle className="size-2.5 shrink-0" />
												Drift flagged
											</span>
										) : (
											<span className="flex items-center gap-1 text-[11px] text-success-2">
												<CheckCircle2 className="size-2.5 shrink-0" />
												Clean
											</span>
										)}
									</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>

			<div className="border-t border-line px-2 py-2">
				<Link
					href={mockSettingsHref(repo)}
					className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink-2 transition-colors hover:bg-surface hover:text-ink"
				>
					<Settings className="size-3.5 shrink-0" />
					Detection rules
				</Link>
			</div>
		</aside>
	);
}
