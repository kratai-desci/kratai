import { AlertTriangle, CheckCircle2, GitBranch, GitPullRequest, Plus, Settings, Workflow } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { MOCK_REPOS, mockLatestPrHref, mockPrHref, mockRepoHref, mockSettingsHref, type MockRepo } from '@/app/mock/_data';

// UI-only mock - entry point for the /mock flow. Repo/PR data lives in
// _data.ts so this, the diagram view, and the PR-detail page all stay in
// sync. Swap for real listRepos()/listRecentPulls() calls once those exist.
function RepoCard({ repo }: { repo: MockRepo }) {
	const flaggedCount = repo.pulls.filter((p) => p.flagged).length;

	return (
		<Card className="flex flex-col gap-4">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<Link href={mockLatestPrHref(repo.repoFullName)} className="truncate text-base font-semibold text-ink hover:text-brand-ink">
						{repo.repoFullName}
					</Link>
					<div className="mt-1 flex items-center gap-2 text-xs text-ink-3">
						<Badge variant="neutral">
							<GitBranch className="mr-1 size-3" />
							{repo.branch}
						</Badge>
						<span>
							{repo.pulls.length} PRs reviewed this week
							{flaggedCount > 0 && (
								<span className="text-warning-2"> · {flaggedCount} drift flag{flaggedCount > 1 ? 's' : ''}</span>
							)}
						</span>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Link
						href={mockRepoHref(repo.repoFullName)}
						className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-2 transition-colors hover:border-brand hover:text-brand-ink"
					>
						<Workflow className="size-3.5" />
						Diagram
					</Link>
					<Link
						href={mockSettingsHref(repo.repoFullName)}
						className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-2 transition-colors hover:border-brand hover:text-brand-ink"
					>
						<Settings className="size-3.5" />
						Rules
					</Link>
				</div>
			</div>

			<ul className="flex flex-col divide-y divide-line">
				{repo.pulls.map((pr) => (
					<li key={pr.number}>
						<Link
							href={mockPrHref(repo.repoFullName, pr.number)}
							className="flex items-center gap-3 py-2.5 text-sm hover:text-brand-ink"
						>
							<GitPullRequest className="size-4 shrink-0 text-ink-3" />
							<span className="min-w-0 flex-1 truncate text-ink-2">
								<span className="text-ink-3">#{pr.number}</span> {pr.title}
							</span>
							{pr.flagged ? (
								<span className="flex shrink-0 items-center gap-1 text-xs font-medium text-warning-2">
									<AlertTriangle className="size-3.5" />
									Drift flagged
								</span>
							) : (
								<span className="flex shrink-0 items-center gap-1 text-xs text-success-2">
									<CheckCircle2 className="size-3.5" />
									Clean
								</span>
							)}
						</Link>
					</li>
				))}
			</ul>
		</Card>
	);
}

export default function MockDashboardPage() {
	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-semibold text-ink">Repos</h1>
					<p className="mt-1 text-sm text-ink-2">Pull requests reviewed against your real architecture.</p>
				</div>
				<Button asChild size="sm">
					<Link href="/mock/onboarding">
						<Plus className="size-4" />
						Connect a repo
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{MOCK_REPOS.map((repo) => (
					<RepoCard key={repo.repoFullName} repo={repo} />
				))}
			</div>
		</div>
	);
}
