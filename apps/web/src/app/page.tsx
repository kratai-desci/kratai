import { LogIn } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { isSignInEnabled } from '@/1_application/auth';
import { signInAction } from '@/1_application/authActions';
import { TrackEvent } from '@/components/analytics/TrackEvent';
import { TryRepoForm } from '@/components/try/TryRepoForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Without this, Next statically prerenders this page once at `next build`
// time, baking in whatever isSignInEnabled() (AUTH_GITHUB_ID/SECRET) happens
// to resolve to during the Docker/Cloud Build step - which normally has no
// access to Cloud Run's runtime env vars, since those are only injected into
// the running container, not the build. That mismatch is exactly what
// produced a landing page permanently stuck showing the mock "no auth
// configured" sign-in link even once the real GitHub OAuth env vars were
// correctly set in Cloud Run - confirmed by comparing against /dashboard,
// which is a dynamic route and correctly saw the real runtime env.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'kratai — Architecture diagrams for your GitHub repos',
	description:
		'Pick a repo and branch, generate an interactive architecture diagram from the real code structure, and export it as Markdown to give AI coding agents accurate context.',
};

const LANGUAGES = [
	{ emoji: '📘', name: 'TypeScript', detail: 'Generics, decorators, interfaces, React/NestJS patterns' },
	{ emoji: '📙', name: 'JavaScript', detail: 'ES6 classes, JSX, JSDoc annotations, React hooks' },
	{ emoji: '🐍', name: 'Python', detail: 'Type hints, async/await, protocols, dataclasses' },
	{ emoji: '☕', name: 'Java', detail: 'Spring Boot, JPA, REST APIs, dependency injection' },
	{ emoji: '🐘', name: 'PHP', detail: 'PHP 7.4+/8.0+, Laravel/Symfony, traits' },
	{ emoji: '🍃', name: 'Spring Boot', detail: 'Controller→View, JPA relationships, REST endpoints, DI' },
	{ emoji: '🎸', name: 'Django', detail: 'View→Template, ORM relationships, REST Framework' },
	{ emoji: '▲', name: 'Next.js', detail: 'Component rendering, Type/DTO relationships, API routes' },
];

function SignInCTA({ children, size = 'default' }: { children: ReactNode; size?: 'default' | 'sm' }) {
	const signInEnabled = isSignInEnabled();
	if (signInEnabled) {
		return (
			<form action={signInAction}>
				<Button type="submit" size={size}>
					{children}
				</Button>
			</form>
		);
	}
	return (
		<Button asChild size={size}>
			<Link href="/dashboard">{children}</Link>
		</Button>
	);
}

export default function LandingPage() {
	return (
		<div className="min-h-screen">
			<TrackEvent event="visit" />

			{/* Nav */}
			<nav className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
					<div className="flex items-center gap-3">
						<Image
							src="/logo-white.png"
							alt="kratai"
							width={28}
							height={28}
							className="opacity-90 light:invert"
						/>
						<span className="text-xl font-semibold text-ink">kratai</span>
					</div>
					<div className="hidden items-center gap-2 md:flex">
						<span className="text-sm text-ink-3">Have a private repo?</span>
						<SignInCTA size="sm">
							<LogIn className="size-4" />
							Sign in with GitHub
						</SignInCTA>
					</div>
				</div>
			</nav>

			{/* Hero - the repo input is the primary CTA (gitdiagram-style), not a
			    button among several competing for attention. Sign-in is a small
			    secondary link underneath, for the one thing the input can't do
			    (private repos). */}
			<section className="flex flex-col items-center gap-10 px-6 py-28 text-center md:py-36">
				<div className="max-w-5xl">
					<h1 className="mb-4 text-5xl leading-tight font-bold text-ink md:text-6xl">
						See your repo&apos;s real
						<br />
						<span className="text-brand-ink">architecture in seconds</span>
					</h1>
					<p className="mx-auto max-w-xl text-xl leading-relaxed text-ink-2">
						Share it with your AI coding agent to keep it aligned with your actual code.
					</p>
				</div>

				<div className="w-full max-w-xl">
					<TryRepoForm size="hero" autoFocus />
				</div>
			</section>

			{/* Proven Performance */}
			<section className="bg-surface-2 px-6 py-24">
				<div className="mx-auto max-w-7xl">
					<div className="mb-16 text-center">
						<h2 className="mb-3 text-2xl font-bold text-ink md:text-3xl">
							Share the MD with Your <span className="text-brand-ink">AI Coding Agent</span>
						</h2>
						<p className="mx-auto max-w-2xl text-lg text-ink-2">
							Give it the exported architecture context instead of raw files, and here&apos;s what
							changes
						</p>
					</div>

					<div className="grid items-center gap-10 lg:grid-cols-2">
						<Image
							src="/screenshots/demo_ss_1_cropped.png"
							alt="Architecture diagram - the same structure kratai exports as Markdown for AI agents"
							width={1000}
							height={730}
							className="rounded-lg border border-line shadow-2xl"
						/>
						<div className="grid grid-cols-2 gap-6">
							{[
								{ stat: '49%', label: 'Fewer Tokens', body: 'Reduction in output tokens generated' },
								{ stat: '66%', label: 'Less Input', body: 'Reduction in total input tokens' },
								{ stat: '58%', label: 'Lower Costs', body: 'Reduction in billing units' },
								{ stat: '70%', label: 'Faster', body: 'Faster completion time' },
							].map((m) => (
								<Card key={m.label} className="p-6 text-center">
									<div className="mb-2 text-4xl font-bold text-brand-ink">{m.stat}</div>
									<h3 className="mb-1 text-lg font-semibold text-ink">{m.label}</h3>
									<p className="text-sm text-ink-2">{m.body}</p>
								</Card>
							))}
						</div>
					</div>

					<p className="mt-8 text-center text-sm text-ink-3 italic">
						* Results from preliminary internal testing (kratai v.1.9.4 vs no skill baseline).
						Actual results may vary depending on task complexity and agent behavior.
					</p>
				</div>
			</section>

			{/* Language & Framework Support */}
			<section id="languages" className="px-6 py-24">
				<div className="mx-auto max-w-7xl">
					<div className="mb-16 text-center">
						<h2 className="mb-3 text-2xl font-bold text-ink md:text-3xl">
							Language &amp; <span className="text-brand-ink">Framework Support</span>
						</h2>
					</div>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{LANGUAGES.map((lang) => (
							<Card key={lang.name} className="p-6 text-center">
								<div className="mb-4 text-4xl">{lang.emoji}</div>
								<h4 className="mb-2 text-xl font-semibold text-ink">{lang.name}</h4>
								<p className="text-sm text-ink-2">{lang.detail}</p>
							</Card>
						))}
						<div className="rounded-lg border border-dashed border-line p-6 text-center">
							<div className="mb-4 text-4xl">⏳</div>
							<h4 className="mb-2 text-xl font-semibold text-warning-2">Coming Soon</h4>
							<p className="text-sm text-ink-2">React, Laravel, and Symfony framework enrichment</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA - repeats the hero's private-repo sign-in prompt, since this is
			    the only ask left by the time someone scrolls this far without
			    having already pasted a repo up top. */}
			<section className="bg-surface-2 px-6 py-24 text-center">
				<h2 className="mb-3 text-2xl font-bold text-ink md:text-3xl">Have a private repo?</h2>
				<p className="mb-6 text-lg text-ink-2">Free to start, no credit card.</p>
				<SignInCTA>
					<LogIn className="size-4" />
					Sign in with GitHub
				</SignInCTA>
			</section>

			{/* Footer */}
			<footer className="border-t border-line bg-surface px-6 py-12">
				<div className="mx-auto max-w-7xl">
					<div className="mb-8 grid gap-8 md:grid-cols-2">
						<div>
							<div className="mb-4 flex items-center gap-2">
								<Image
									src="/logo-white.png"
									alt="kratai"
									width={24}
									height={24}
									className="opacity-90 light:invert"
								/>
								<span className="text-lg font-semibold text-ink">kratai</span>
							</div>
							<p className="text-sm text-ink-2">Architecture diagrams for your GitHub repos.</p>
						</div>

						<div>
							<h4 className="mb-4 font-semibold text-ink">Product</h4>
							<ul className="space-y-2 text-sm text-ink-2">
								<li>
									<Link href="/dashboard" className="hover:text-brand-ink">
										Dashboard
									</Link>
								</li>
							</ul>
						</div>
					</div>

					<div className="flex items-center justify-center border-t border-line pt-8">
						<p className="text-sm text-ink-2">© 2026 kratai. Made with ❤️ by the kratai team</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
