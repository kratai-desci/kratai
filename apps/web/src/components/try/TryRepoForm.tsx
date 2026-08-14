'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { parseRepoInput } from '@/1_application/githubUrls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * One small, well-known repo per language kratai advertises support for (see
 * LANGUAGES in app/page.tsx) - each one actually timed end-to-end against
 * the real clone+parse pipeline, not picked by reputation. Rejected
 * candidates, for reference:
 * - expressjs/express: fast, but 0 relationships (mostly plain functions).
 * - spring-projects/spring-petclinic: source sits under a package literally
 *   named `samples` (org.springframework.samples.petclinic), which
 *   WorkspaceScanner's demo/example-folder exclusion heuristic prunes
 *   entirely - a real parser limitation (see
 *   packages/core/src/parsing/workspaceScanner.ts's shouldExcludeFolder).
 * - videojs/video.js, stleary/JSON-java, chartjs/Chart.js, fastify/fastify:
 *   real relationships, but 10s-2min+ to clone+parse - the opposite failure
 *   mode, too slow for a click-to-instant-result demo.
 */
const EXAMPLE_REPOS = [
	'TooTallNate/Java-WebSocket',
	'nestjs/typescript-starter',
	'pallets/flask',
	'sindresorhus/p-queue',
];

export function TryRepoForm({
	autoFocus,
	className,
	size = 'default',
}: {
	autoFocus?: boolean;
	className?: string;
	/** 'hero' is the primary landing-page CTA (gitdiagram-style: the input
	 * itself is the headline action) - bigger input/button, a brand-tinted
	 * glow instead of a plain border. 'default' is used everywhere else
	 * (app/try's own page). */
	size?: 'default' | 'hero';
}) {
	const router = useRouter();
	const [value, setValue] = useState('');
	const [error, setError] = useState<string | null>(null);

	function go(repoFullName: string) {
		router.push(`/try/${repoFullName}`);
	}

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		const repoFullName = parseRepoInput(value);
		if (!repoFullName) {
			setError("That doesn't look like a public GitHub repo - try owner/repo or a full github.com URL.");
			return;
		}
		go(repoFullName);
	}

	const hero = size === 'hero';

	return (
		<div className={className}>
			<form
				onSubmit={handleSubmit}
				className={cn(
					'flex flex-col gap-3 sm:flex-row',
					hero &&
						'rounded-xl border border-brand/30 bg-panel p-2 shadow-[0_8px_32px_rgba(244,208,63,0.12)] sm:rounded-full'
				)}
			>
				<Input
					value={value}
					onChange={(e) => {
						setValue(e.target.value);
						setError(null);
					}}
					placeholder="Paste a public GitHub repo URL..."
					autoFocus={autoFocus}
					className={hero ? 'border-none bg-transparent px-4 py-4 text-base focus-visible:ring-0' : undefined}
				/>
				<Button type="submit" size={hero ? 'default' : undefined} className={hero ? 'sm:rounded-full' : undefined}>
					Diagram it
					<ArrowRight className="size-4" />
				</Button>
			</form>
			{error && <p className="mt-2 text-sm text-danger-2">{error}</p>}
			<div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
				<span className="text-ink-3">Try:</span>
				{EXAMPLE_REPOS.map((repo) => (
					<button
						key={repo}
						type="button"
						onClick={() => go(repo)}
						className="rounded-full border border-line px-3 py-1 text-ink-2 transition-colors hover:border-brand hover:text-brand-ink"
					>
						{repo}
					</button>
				))}
			</div>
		</div>
	);
}
