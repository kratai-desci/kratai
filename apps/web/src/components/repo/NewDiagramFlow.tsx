'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { listBranchesAction } from '@/1_application/repoActions';
import type { Branch, Repo } from '@/2_domain';
import { Button } from '@/components/ui/button';

import { BranchPicker } from './BranchPicker';
import { RepoPicker } from './RepoPicker';

export function NewDiagramFlow({ repos }: { repos: Repo[] }) {
	const router = useRouter();
	const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
	const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
	const [branches, setBranches] = useState<Branch[]>([]);
	const [isLoadingBranches, startTransition] = useTransition();

	function handleSelectRepo(repo: Repo) {
		setSelectedRepo(repo);
		setBranches([]);
		// Optimistic: Repo.defaultBranch is already known from the repo list,
		// so the branch is selected (and "Continue" enabled) immediately,
		// without waiting on the branch-list fetch below.
		setSelectedBranch(repo.defaultBranch);

		startTransition(async () => {
			const result = await listBranchesAction(repo.fullName, repo.defaultBranch);
			setBranches(result);
		});
	}

	function handleContinue() {
		if (!selectedRepo || !selectedBranch) return;
		const params = new URLSearchParams({ repo: selectedRepo.fullName, branch: selectedBranch });
		router.push(`/configure?${params.toString()}`);
	}

	return (
		<div className="flex flex-col gap-8">
			<section>
				<h2 className="mb-3 text-sm font-semibold tracking-wide text-ink-3 uppercase">
					1. Choose a repository
				</h2>
				<RepoPicker repos={repos} selected={selectedRepo} onSelect={handleSelectRepo} />
			</section>

			{selectedRepo && (
				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-ink-3 uppercase">
						2. Choose a branch
					</h2>
					<BranchPicker
						branches={branches}
						selected={selectedBranch}
						onSelect={setSelectedBranch}
						isLoading={isLoadingBranches}
					/>
				</section>
			)}

			<div className="flex justify-end">
				<Button onClick={handleContinue} disabled={!selectedRepo || !selectedBranch}>
					Continue
					<ArrowRight className="size-4" />
				</Button>
			</div>
		</div>
	);
}
