import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { DiagramData, KrataiConfig, MethodInfo } from '@kratai/core';

import { generateDiagramHtml } from '@/1_application/diagram';
import { DiagramFrame } from '@/components/diagram/DiagramFrame';
import { Badge } from '@/components/ui/badge';

import sampleDiagram from '@/3_infrastructure/fixtures/sample-diagram.json';
import { getMockPr, mockRepoHref, mockSettingsHref } from '@/app/mock/_data';
import { PrSidebar } from '@/app/mock/_components/PrSidebar';

// UI-only mock of the PR-review product experience - flagship screen for
// visualizing the "PR review on the architecture" pivot before any of this
// is real. Renders the REAL diagram (real parser output, real renderer -
// see MockDiagramSource.ts for why this fixture is genuine DiagramData, not
// a fabricated image) with one method injected in-memory to simulate this
// PR's change, so the diff highlighting shown is the real feature working
// on real data, not a mockup. Not linked from anywhere, no auth - internal
// only. Only PR #142 on kratai/kratai-content has a built architectural-drift
// scenario; every other PR in _data.ts renders the plain diagram with a
// "no drift" review card so the flagged/clean state matches what the
// dashboard promised before the user clicked through.
const FLAGGED_SCENARIO = {
	repoFullName: 'kratai/kratai-content',
	number: 142,
	filePath: 'packages/core/src/view/ViewManager.ts',
	className: 'ViewManager',
	addedMethod: {
		name: 'duplicateView',
		parameters: [
			{ name: 'workspacePath', type: 'string', optional: false },
			{ name: 'viewId', type: 'string', optional: false },
			{ name: 'newName', type: 'string', optional: false },
		],
		returnType: 'Promise<DiagramView>',
		changeStatus: 'added' as const,
	} satisfies Partial<MethodInfo> & { name: string },
};

function buildScenarioDiagram(): DiagramData {
	// Structured clone so we never mutate the shared fixture module.
	const data = structuredClone(sampleDiagram) as DiagramData;
	const target = data.classes.find(
		(c) => c.name === FLAGGED_SCENARIO.className && c.filePath === FLAGGED_SCENARIO.filePath
	);
	if (target) {
		target.methods = [...(target.methods ?? []), FLAGGED_SCENARIO.addedMethod as MethodInfo];
		target.changeStatus = 'modified';
	}
	return data;
}

export default async function MockPrPage({
	params,
}: {
	params: Promise<{ repo: string; number: string }>;
}) {
	const { repo: rawRepo, number: rawNumber } = await params;
	const repo = decodeURIComponent(rawRepo);
	const number = Number(rawNumber);

	const pr = getMockPr(repo, number);
	const title = pr?.title ?? 'Pull request';
	const isDriftScenario = repo === FLAGGED_SCENARIO.repoFullName && number === FLAGGED_SCENARIO.number;

	const config: KrataiConfig = {
		selectedFolders: [],
		selectedExtensions: [],
		gitDiff: { enabled: isDriftScenario },
	};
	const diagramData = isDriftScenario ? buildScenarioDiagram() : (sampleDiagram as DiagramData);
	const { html } = generateDiagramHtml(diagramData, repo, config);

	return (
		<div className="flex h-full min-h-0 bg-surface text-ink">
			<PrSidebar repo={repo} />

			<div className="flex min-h-0 flex-1 flex-col">
				<header className="flex shrink-0 items-center gap-3 border-b border-line px-6 py-3 text-sm text-ink-2">
					<Link href={mockRepoHref(repo)} className="font-medium text-ink-2 hover:text-brand-ink">
						{repo}
					</Link>
					<span className="text-ink-3">/</span>
					<span>
						PR #{rawNumber} · {title}
					</span>
					{isDriftScenario && (
						<>
							<span className="text-ink-3">·</span>
							<span className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs">
								{FLAGGED_SCENARIO.filePath}
							</span>
						</>
					)}
					<span className="ml-auto text-xs text-ink-3">Mock</span>
				</header>

				<div className="flex flex-1 overflow-hidden">
					<div className="flex-1">
						<DiagramFrame
							html={html}
							viewId="mock"
							repoFullName="kratai/kratai"
							branch="main"
							settingsHref={mockSettingsHref(repo)}
						/>
					</div>

					<aside className="w-[420px] shrink-0 overflow-y-auto border-l border-line bg-surface-2 p-5">
					<div className="rounded-xl border border-line bg-panel">
						<div className="flex items-center gap-3 border-b border-line px-4 py-3">
							<div className="flex size-8 shrink-0 items-center justify-center rounded-md border-2 border-brand-ink bg-surface">
								<span className="text-sm">🐇</span>
							</div>
							<div className="text-sm">
								<span className="font-semibold text-ink">kratai</span>{' '}
								<span className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">
									Bot
								</span>
							</div>
							<span className="ml-auto text-xs text-ink-3">reviewed on the architecture diagram</span>
						</div>

						{isDriftScenario ? (
							<div className="space-y-3 px-4 py-4">
								<div className="flex items-center gap-2 text-sm font-semibold text-warning-2">
									<span>⚠ Architectural drift</span>
									<Badge variant="warning">Bloated controller</Badge>
								</div>

								<p className="text-sm leading-relaxed text-ink-2">
									<code className="rounded bg-surface-2 px-1 py-0.5 text-xs text-brand-ink">
										{FLAGGED_SCENARIO.className}
									</code>{' '}
									already mixes registry I/O (<code className="text-xs">loadRegistry</code>,{' '}
									<code className="text-xs">saveRegistry</code>) with CRUD orchestration (
									<code className="text-xs">createView</code>, <code className="text-xs">updateView</code>). Adding{' '}
									<code className="text-xs">{FLAGGED_SCENARIO.addedMethod.name}</code> grows it to 16 methods
									spanning both concerns.
								</p>

								<div className="overflow-hidden rounded-lg border border-line font-mono text-xs">
									<div className="bg-success/10 px-3 py-2 text-success-2">
										+ {FLAGGED_SCENARIO.addedMethod.name}(workspacePath: string, viewId: string, newName:
										string): {FLAGGED_SCENARIO.addedMethod.returnType}
									</div>
								</div>

								<p className="text-xs font-medium text-brand-ink">→ Highlighted on the diagram</p>
							</div>
						) : (
							<div className="space-y-2 px-4 py-4">
								<div className="flex items-center gap-2 text-sm font-semibold text-success-2">
									<CheckCircle2 className="size-4" />
									No architectural drift
								</div>
								<p className="text-sm leading-relaxed text-ink-2">
									Changes are consistent with the current structure. No further action needed.
								</p>
							</div>
						)}
					</div>

					{isDriftScenario && (
						<div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-panel p-4">
							<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#6e40c9] text-xs font-bold text-white">
								JB
							</div>
							<div className="text-sm">
								<div className="mb-1">
									<span className="font-semibold text-ink">jbrooks215</span>{' '}
									<span className="rounded border border-line bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">
										author
									</span>
								</div>
								<p className="text-ink-2">Fair — I&apos;ll split registry I/O into a separate ViewRegistry class.</p>
							</div>
						</div>
					)}
				</aside>
				</div>
			</div>
		</div>
	);
}
