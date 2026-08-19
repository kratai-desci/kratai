'use client';

import { use } from 'react';

import { mockLatestPrHref, mockRepoHref } from '@/app/mock/_data';
import { useDetectionRules } from '@/app/mock/_detectionRules';
import { PrSidebar } from '@/app/mock/_components/PrSidebar';
import { RuleCard } from '@/app/mock/_components/RuleCard';
import { SettingsTabs } from '@/app/mock/_components/SettingsTabs';

export default function MockSettingsPatternsPage({ params }: { params: Promise<{ repo: string }> }) {
	const { repo: rawRepo } = use(params);
	const repo = decodeURIComponent(rawRepo);
	const { rules, toggleRule, setSeverity } = useDetectionRules();

	const patternRules = rules.filter((r) => r.category === 'pattern');
	const enabledCount = patternRules.filter((r) => r.enabled).length;

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

					<SettingsTabs repo={repo} active="pattern" />

					<section>
						<h2 className="mb-1 text-sm font-semibold tracking-wide text-ink-3 uppercase">Design pattern usage</h2>
						<p className="mb-3 text-xs text-ink-3">
							Flags where a known design pattern is used, missing, or could simplify a change. {enabledCount} of{' '}
							{patternRules.length} enabled.
						</p>
						<div className="flex flex-col gap-2">
							{patternRules.map((rule) => (
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
