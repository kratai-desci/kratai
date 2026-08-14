import { GitBranch, GitCommitHorizontal } from 'lucide-react';
import Link from 'next/link';

import { githubCommitUrl, shortSha } from '@/1_application/githubUrls';

import { TrySidebarCreateButton } from './TrySidebarCreateButton';

/**
 * Anonymous counterpart to DiagramSidebar, for app/try/[owner]/[repo] - same
 * markup/classNames so the anonymous preview reads as a first-class part of
 * the product, not a bolted-on marketing page, but built as its own small
 * component rather than reusing DiagramSidebar with fabricated data: there's
 * no real WebDiagramView here (no id, no owner, nothing to navigate to), and
 * the create button's behavior genuinely differs (see createHref below), so
 * forcing this through DiagramSidebar's saved-view-list shape would mean
 * more special-casing there than just writing this directly.
 */
export function TryDiagramSidebar({
	repoFullName,
	entry,
	createHref,
	callbackUrl,
}: {
	repoFullName: string;
	/** Undefined while generation is still unresolved to the caller (e.g. it failed) - the repo header still shows, just without a diagram row under it. */
	entry?: { branch: string; name: string; commitSha?: string };
	/** Present only for an already-signed-in visitor (viewing this anonymous
	 * preview after auth) - goes straight to /new. Absent for a genuinely
	 * anonymous visitor, in which case the button signs them in first (see
	 * callbackUrl) instead of linking anywhere. */
	createHref?: string;
	/** Where GitHub sign-in should return to - always this same preview. */
	callbackUrl: string;
}) {
	return (
		<aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface-2">
			<div className="flex items-center justify-between border-b border-line px-4 py-3">
				<Link href="/" className="text-sm font-medium text-ink-2 hover:text-brand-ink">
					← Home
				</Link>
				<TrySidebarCreateButton repo={repoFullName} createHref={createHref} callbackUrl={callbackUrl} />
			</div>

			<nav className="flex-1 overflow-y-auto px-2 py-3">
				<div className="mb-4">
					<div className="mb-1.5 px-2">
						<p className="truncate text-xs font-semibold text-ink-2">{repoFullName}</p>
						{entry && (
							<p className="flex items-center gap-1 text-[11px] text-ink-3">
								<GitBranch className="size-2.5 shrink-0" />
								<span className="truncate">{entry.branch}</span>
							</p>
						)}
					</div>

					{entry ? (
						<ul className="flex flex-col gap-0.5">
							<li className="flex items-center justify-between gap-2 rounded-md bg-brand/15 px-2 text-sm text-brand-ink">
								<span className="min-w-0 flex-1 truncate py-1.5">{entry.name}</span>
								{entry.commitSha && (
									<a
										href={githubCommitUrl(repoFullName, entry.commitSha)}
										target="_blank"
										rel="noreferrer"
										title={entry.commitSha}
										className="flex shrink-0 items-center gap-0.5 font-mono text-[10px] text-ink-3 hover:text-brand-ink hover:underline"
									>
										<GitCommitHorizontal className="size-2.5" />
										{shortSha(entry.commitSha)}
									</a>
								)}
							</li>
						</ul>
					) : (
						<p className="px-2 text-sm text-ink-3">Couldn&apos;t generate a diagram.</p>
					)}
				</div>
			</nav>
		</aside>
	);
}
