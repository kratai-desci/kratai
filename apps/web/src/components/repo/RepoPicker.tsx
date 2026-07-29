'use client';

import { Lock } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Repo } from '@/lib/data/types';

export function RepoPicker({
	repos,
	selected,
	onSelect,
}: {
	repos: Repo[];
	selected: Repo | null;
	onSelect: (repo: Repo) => void;
}) {
	return (
		<div className="flex flex-col gap-2">
			{repos.map((repo) => (
				<button
					key={repo.id}
					type="button"
					onClick={() => onSelect(repo)}
					className={cn(
						'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
						selected?.id === repo.id
							? 'border-brand bg-brand/10'
							: 'border-line bg-panel hover:border-brand/60'
					)}
				>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<span className="truncate font-medium text-ink">{repo.fullName}</span>
							{repo.private && <Lock className="size-3 shrink-0 text-ink-3" />}
						</div>
						<p className="truncate text-sm text-ink-2">{repo.description}</p>
					</div>
					<span className="ml-4 shrink-0 text-xs text-ink-3">
						{new Date(repo.updatedAt).toLocaleDateString()}
					</span>
				</button>
			))}
		</div>
	);
}
