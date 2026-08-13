'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { parseRepoInput } from '@/1_application/githubUrls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** One small, well-known repo per language kratai advertises support for
 * (see LANGUAGES in app/page.tsx) - picked for fast clone/parse, not
 * exhaustive coverage, so clicking one actually feels instant. */
const EXAMPLE_REPOS = [
	'expressjs/express',
	'nestjs/typescript-starter',
	'pallets/flask',
	'spring-projects/spring-petclinic',
];

export function TryRepoForm({ autoFocus, className }: { autoFocus?: boolean; className?: string }) {
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

	return (
		<div className={className}>
			<form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
				<Input
					value={value}
					onChange={(e) => {
						setValue(e.target.value);
						setError(null);
					}}
					placeholder="e.g. facebook/react or a github.com URL"
					autoFocus={autoFocus}
				/>
				<Button type="submit">
					Generate
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
