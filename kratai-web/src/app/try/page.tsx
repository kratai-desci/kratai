import { TryRepoForm } from '@/components/try/TryRepoForm';

export default function TryPage() {
	return (
		<div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
			<h1 className="text-4xl font-bold text-ink">Diagram any public repo</h1>
			<p className="max-w-lg text-lg text-ink-2">
				Paste a public GitHub repo. No sign-in required - see the real architecture in seconds.
			</p>

			<TryRepoForm autoFocus className="w-full max-w-lg" />

			<p className="text-xs text-ink-3">Private repos, saved diagrams, and PR review need a GitHub sign-in.</p>
		</div>
	);
}
