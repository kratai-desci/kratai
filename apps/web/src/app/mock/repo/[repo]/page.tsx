import { GitBranch } from 'lucide-react';
import Link from 'next/link';
import type { DiagramData, KrataiConfig } from '@kratai/core';

import { generateDiagramHtml } from '@/1_application/diagram';
import { DiagramFrame } from '@/components/diagram/DiagramFrame';

import sampleDiagram from '@/3_infrastructure/fixtures/sample-diagram.json';
import { getMockRepo, mockLatestPrHref, mockSettingsHref } from '@/app/mock/_data';
import { PrSidebar } from '@/app/mock/_components/PrSidebar';

// Repo-level diagram view, no PR selected - the architecture on its own,
// same real parser/renderer pipeline as the PR-detail scenario minus the
// diff mutation and gitDiff highlighting (nothing changed here to diff
// against). Entry point for "just show me the current architecture."
const MOCK_CONFIG: KrataiConfig = { selectedFolders: [], selectedExtensions: [] };

export default async function MockRepoPage({ params }: { params: Promise<{ repo: string }> }) {
	const { repo: rawRepo } = await params;
	const repo = decodeURIComponent(rawRepo);
	const repoData = getMockRepo(repo);
	const branch = repoData?.branch ?? 'main';

	const { html } = generateDiagramHtml(sampleDiagram as DiagramData, repo, MOCK_CONFIG);

	return (
		<div className="flex h-full min-h-0 bg-surface text-ink">
			<PrSidebar repo={repo} />

			<div className="flex min-h-0 flex-1 flex-col">
				<header className="flex shrink-0 items-center gap-3 border-b border-line px-6 py-3 text-sm text-ink-2">
					<span className="font-medium text-ink">{repo}</span>
					<span className="flex items-center gap-1 text-xs text-ink-3">
						<GitBranch className="size-3" />
						{branch}
					</span>
					<Link href={mockLatestPrHref(repo)} className="ml-auto text-xs font-medium text-brand-ink hover:underline">
						Open latest pull request →
					</Link>
				</header>

				<div className="flex-1 overflow-hidden">
					<DiagramFrame
						html={html}
						viewId="mock"
						repoFullName="kratai/kratai"
						branch={branch}
						settingsHref={mockSettingsHref(repo)}
					/>
				</div>
			</div>
		</div>
	);
}
