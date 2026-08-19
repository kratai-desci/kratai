'use client';

import { Building2, Check, CheckCircle2, Circle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { useDetectionRules } from '@/app/mock/_detectionRules';
import { RuleCard } from '@/app/mock/_components/RuleCard';

interface CandidateRepo {
	fullName: string;
	private: boolean;
	defaultBranch: string;
	updatedAt: string;
}

// Mirrors the real /new repo picker (RepoPicker.tsx) but multi-select and
// no branch step - onboarding for the PR-review product means "enable
// review on N repos" up front, not picking one repo+branch to generate a
// single diagram. kratai-content and kratai-web start preselected since
// those are the two repos the rest of the /mock flow (dashboard, PR pages)
// already has history for.
const CANDIDATE_REPOS: CandidateRepo[] = [
	{
		fullName: 'kratai/kratai-content',
		private: false,
		defaultBranch: 'main',
		updatedAt: '2026-08-08T00:00:00.000Z',
	},
	{
		fullName: 'kratai/kratai-web',
		private: false,
		defaultBranch: 'main',
		updatedAt: '2026-08-07T00:00:00.000Z',
	},
	{
		fullName: 'kratai/kratai-cli',
		private: false,
		defaultBranch: 'main',
		updatedAt: '2026-07-30T00:00:00.000Z',
	},
	{
		fullName: 'kratai/kratai-docs',
		private: false,
		defaultBranch: 'main',
		updatedAt: '2026-07-22T00:00:00.000Z',
	},
	{
		fullName: 'acme-corp/legacy-billing-service',
		private: true,
		defaultBranch: 'main',
		updatedAt: '2026-06-15T00:00:00.000Z',
	},
];

const PRESELECTED = ['kratai/kratai-content', 'kratai/kratai-web'];

const STEP_LABELS = ['GitHub account', 'Repositories', 'Detection rules', 'Design patterns'] as const;

function StepIndicator({ step }: { step: number }) {
	return (
		<div className="flex items-center">
			{STEP_LABELS.map((label, i) => (
				<div key={label} className="flex flex-1 items-center last:flex-none">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
								i < step
									? 'bg-brand text-on-brand'
									: i === step
										? 'border-2 border-brand text-brand-ink'
										: 'border border-line text-ink-3'
							)}
						>
							{i < step ? <Check className="size-3.5" /> : i + 1}
						</div>
						<span className={cn('text-xs font-medium whitespace-nowrap', i === step ? 'text-ink' : 'text-ink-3')}>
							{label}
						</span>
					</div>
					{i < STEP_LABELS.length - 1 && (
						<div className={cn('mx-3 h-px flex-1', i < step ? 'bg-brand' : 'bg-line')} />
					)}
				</div>
			))}
		</div>
	);
}

export default function MockOnboardingPage() {
	const router = useRouter();
	const [step, setStep] = useState(0);
	const [selected, setSelected] = useState<Set<string>>(new Set(PRESELECTED));
	const { rules, toggleRule, setSeverity } = useDetectionRules();

	function toggle(fullName: string) {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(fullName)) next.delete(fullName);
			else next.add(fullName);
			return next;
		});
	}

	const generalRules = rules.filter((r) => r.category === 'general');
	const patternRules = rules.filter((r) => r.category === 'pattern');
	const isLastStep = step === STEP_LABELS.length - 1;

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
			<div>
				<h1 className="text-3xl font-semibold text-ink">Connect your repositories</h1>
				<p className="mt-2 text-sm text-ink-2">
					kratai reviews every PR against your real architecture.
				</p>
			</div>

			<StepIndicator step={step} />

			{step === 0 && (
				<section>
					<Card className="flex items-center gap-3 hover:border-line hover:shadow-none">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/15">
							<Building2 className="size-4 text-brand-ink" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-ink">GitHub account connected</p>
							<p className="text-xs text-ink-3">jbrooks215</p>
						</div>
						<CheckCircle2 className="size-5 shrink-0 text-success-2" />
					</Card>
				</section>
			)}

			{step === 1 && (
				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-wide text-ink-3 uppercase">Repositories</h2>
					<div className="flex flex-col gap-2">
						{CANDIDATE_REPOS.map((repo) => {
							const isSelected = selected.has(repo.fullName);
							return (
								<button
									key={repo.fullName}
									type="button"
									onClick={() => toggle(repo.fullName)}
									className={cn(
										'flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
										isSelected ? 'border-brand bg-brand/10' : 'border-line bg-panel hover:border-brand/60'
									)}
								>
									{isSelected ? (
										<CheckCircle2 className="size-5 shrink-0 text-brand-ink" />
									) : (
										<Circle className="size-5 shrink-0 text-ink-3" />
									)}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="truncate font-medium text-ink">{repo.fullName}</span>
											{repo.private && <Lock className="size-3 shrink-0 text-ink-3" />}
										</div>
										<p className="text-xs text-ink-3">{repo.defaultBranch}</p>
									</div>
									<span className="shrink-0 text-xs text-ink-3">
										{new Date(repo.updatedAt).toLocaleDateString()}
									</span>
								</button>
							);
						})}
					</div>
				</section>
			)}

			{step === 2 && (
				<section>
					<h2 className="mb-1 text-sm font-semibold tracking-wide text-ink-3 uppercase">Detection rules</h2>
					<p className="mb-3 text-xs text-ink-3">
						Architecture and code-health issues, independent of any specific pattern. Applied to every repo you
						just selected — adjust per-repo anytime from its Detection rules page.{' '}
						{generalRules.filter((r) => r.enabled).length} of {generalRules.length} enabled.
					</p>
					<div className="flex flex-col gap-2">
						{generalRules.map((rule) => (
							<RuleCard key={rule.id} rule={rule} onToggle={toggleRule} onSeverityChange={setSeverity} />
						))}
					</div>
				</section>
			)}

			{step === 3 && (
				<section>
					<h2 className="mb-1 text-sm font-semibold tracking-wide text-ink-3 uppercase">Design patterns</h2>
					<p className="mb-3 text-xs text-ink-3">
						Flags where a known design pattern is used, missing, or could simplify a change. Applied to every
						repo you just selected. {patternRules.filter((r) => r.enabled).length} of {patternRules.length}{' '}
						enabled.
					</p>
					<div className="flex flex-col gap-2">
						{patternRules.map((rule) => (
							<RuleCard key={rule.id} rule={rule} onToggle={toggleRule} onSeverityChange={setSeverity} />
						))}
					</div>
				</section>
			)}

			<div className="flex items-center justify-between">
				{step > 0 ? (
					<Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
						Back
					</Button>
				) : (
					<div />
				)}

				{isLastStep ? (
					<Button disabled={selected.size === 0} onClick={() => router.push('/mock/dashboard')}>
						Start reviewing {selected.size} repo{selected.size === 1 ? '' : 's'}
					</Button>
				) : (
					<Button disabled={step === 1 && selected.size === 0} onClick={() => setStep((s) => s + 1)}>
						Continue
					</Button>
				)}
			</div>
		</div>
	);
}
