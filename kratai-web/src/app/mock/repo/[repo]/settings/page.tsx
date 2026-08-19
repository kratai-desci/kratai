'use client';

import { use } from 'react';

import { mockLatestPrHref, mockRepoHref } from '@/app/mock/_data';
import { useDetectionRules } from '@/app/mock/_detectionRules';
import { PrSidebar } from '@/app/mock/_components/PrSidebar';
import { RuleCard } from '@/app/mock/_components/RuleCard';
import { SettingsTabs } from '@/app/mock/_components/SettingsTabs';

// Detection rules are a distinct concept from the real diagram-generation
// config at /configure (which picks folders/extensions to include) - this
// is what the "⚙️ Settings" button inside the diagram (see
// packages/viewer/src/classDiagramView.ts) now points to in the /mock tree,
// via DiagramFrame's settingsHref override. Split into two pages (general
// vs. design-pattern rules, see the sibling /patterns route) so a repo's
// preferences aren't one long scrolling list - same rule set as the
// "Choose what to detect" onboarding steps (see _detectionRules.ts).
export default function MockSettingsPage({ params }: { params: Promise<{ repo: string }> }) {
	const { repo: rawRepo } = use(params);
	const repo = decodeURIComponent(rawRepo);
	const { rules, toggleRule, setSeverity } = useDetectionRules();

	const generalRules = rules.filter((r) => r.category === 'general');
	const enabledCount = generalRules.filter((r) => r.enabled).length;

	return (
		<div className="flex h-full min-h-0 bg-surface text-ink">
			<PrSidebar repo={repo} />

			<div className="min-h-0 flex-1 overflow-y-auto">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
					<div>
						<h1 className="text-2xl font-semibold text-ink">Detection rules</h1>
						<p className="mt-1 text-sm text-ink-2">
							Choose what kratai flags on new pull requests for{' '}
							<span className="font-medium text-ink">{repo}</span>.
						</p>
						<a href={mockRepoHref(repo)} className="mt-2 inline-block text-xs font-medium text-brand-ink hover:underline">
							← Back to diagram
						</a>
					</div>

					<SettingsTabs repo={repo} active="general" />

					<section>
						<h2 className="mb-1 text-sm font-semibold tracking-wide text-ink-3 uppercase">General principles</h2>
						<p className="mb-3 text-xs text-ink-3">
							Architecture and code-health issues, independent of any specific pattern. {enabledCount} of{' '}
							{generalRules.length} enabled.
						</p>
						<div className="flex flex-col gap-2">
							{generalRules.map((rule) => (
								<RuleCard key={rule.id} rule={rule} onToggle={toggleRule} onSeverityChange={setSeverity} />
							))}
						</div>
					</section>

					<a href={mockLatestPrHref(repo)} className="text-xs font-medium text-brand-ink hover:underline">
						Open latest pull request →
					</a>
				</div>
			</div>
		</div>
	);
}
