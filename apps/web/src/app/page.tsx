import { LogIn, Users2, Waypoints } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { isSignInEnabled } from '@/1_application/auth';
import { signInAction } from '@/1_application/authActions';
import { TrackEvent } from '@/components/analytics/TrackEvent';
import { Button } from '@/components/ui/button';

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
	title: 'kratai — PR Review on the Architecture',
	description: 'Every PR reviewed against your real architecture — for humans and AI.',
};

const STACK = ['TypeScript', 'JavaScript', 'Python', 'Java', 'PHP', 'Spring', 'Django', 'Next.js'];

const DIFFERENTIATORS: Array<{
	icon: LucideIcon;
	title: string;
	body?: ReactNode;
	bullets?: string[];
}> = [
	{
		icon: Waypoints,
		title: 'Catches architectural drift',
		bullets: ['Detects bloated controllers', 'Detects over-engineered code'],
	},
	{
		icon: Users2,
		title: 'Built for humans and AI',
		bullets: ['Every change maps to the diagram', 'AI agents get the same architectural context'],
	},
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
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
					<div className="flex items-center gap-2 sm:gap-3">
						<Image
							src="/logo-white.png"
							alt="kratai"
							width={28}
							height={28}
							className="opacity-90 light:invert"
						/>
						<span className="text-lg font-semibold text-ink sm:text-xl">kratai</span>
					</div>
					<div className="flex items-center gap-4 sm:gap-8">
						<Link
							href="/pricing"
							className="hidden text-sm font-medium text-ink-2 hover:text-brand-ink sm:inline"
						>
							Pricing
						</Link>
						<SignInCTA size="sm">
							<LogIn className="size-4" />
							<span className="hidden sm:inline">Sign in with GitHub</span>
							<span className="sm:hidden">Sign in</span>
						</SignInCTA>
					</div>
				</div>
			</nav>

			{/* Hero */}
			<section className="px-6 py-24">
				<div className="mx-auto max-w-5xl text-center">
					<h1 className="mb-6 text-5xl leading-tight font-bold text-ink md:text-6xl">
						Review Pull Requests <span className="text-brand-ink">on the Architecture</span>
					</h1>
					<p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-ink-2">
						kratai maps your codebase so every PR is reviewed against the real architecture — for
						humans and AI, together.
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<SignInCTA>
							<LogIn className="size-4" />
							Sign in with GitHub
						</SignInCTA>
					</div>
					<p className="mt-6 text-xs text-ink-3">Free to start, no credit card.</p>

					<div className="mt-16">
						<Image
							src="/screenshots/demo.gif"
							alt="kratai — PR review on the architecture diagram"
							width={1920}
							height={1080}
							className="rounded-lg border border-line shadow-2xl"
							priority
							unoptimized
						/>
					</div>
				</div>
			</section>

			{/* Differentiators */}
			<section className="px-6 pb-24">
				<div className="mx-auto max-w-5xl space-y-20">
					<div className="grid gap-12 lg:grid-cols-2 lg:items-center">
						<div className="text-center sm:text-left">
							<Waypoints className="mx-auto mb-4 size-6 text-brand-ink sm:mx-0" />
							<h3 className="mb-3 font-semibold text-ink">{DIFFERENTIATORS[0].title}</h3>
							<ul className="inline-block space-y-2 text-left text-sm text-ink-2">
								{DIFFERENTIATORS[0].bullets?.map((b) => (
									<li key={b} className="flex items-start gap-2">
										<span className="mt-2 size-1 shrink-0 rounded-full bg-brand-ink" />
										{b}
									</li>
								))}
							</ul>
						</div>
						<div>
							<Image
								src="/screenshots/pr_review_mockup_v2.png"
								alt="kratai leaving a PR review comment that flags architectural drift, with a link back to the architecture diagram"
								width={1304}
								height={1114}
								className="w-full rounded-lg border border-line shadow-xl"
							/>
						</div>
					</div>

					<div className="grid gap-12 lg:grid-cols-2 lg:items-center">
						<div className="lg:order-1">
							<Image
								src="/screenshots/demo_ss_1_cropped.png"
								alt="Architecture diagram with added, removed, and modified members highlighted directly on the class nodes"
								width={866}
								height={696}
								className="w-full rounded-lg border border-line shadow-xl"
							/>
						</div>
						<div className="text-center sm:text-left lg:order-2">
							<Users2 className="mx-auto mb-4 size-6 text-brand-ink sm:mx-0" />
							<h3 className="mb-3 font-semibold text-ink">{DIFFERENTIATORS[1].title}</h3>
							<ul className="inline-block space-y-2 text-left text-sm text-ink-2">
								{DIFFERENTIATORS[1].bullets?.map((b) => (
									<li key={b} className="flex items-start gap-2">
										<span className="mt-2 size-1 shrink-0 rounded-full bg-brand-ink" />
										{b}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* Stack */}
			<section className="border-t border-line px-6 py-12">
				<p className="mx-auto max-w-5xl text-center text-sm text-ink-3">{STACK.join(' · ')}</p>
			</section>

			{/* Footer */}
			<footer className="border-t border-line bg-surface px-6 py-8">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
					<div className="flex items-center gap-2">
						<Image
							src="/logo-white.png"
							alt="kratai"
							width={20}
							height={20}
							className="opacity-90 light:invert"
						/>
						<span className="text-sm text-ink-2">PR review on the architecture.</span>
					</div>
					<div className="flex items-center gap-6 text-sm text-ink-2">
						<Link href="/pricing" className="hover:text-brand-ink">
							Pricing
						</Link>
						<Link href="/dashboard" className="hover:text-brand-ink">
							Dashboard
						</Link>
						<span className="text-ink-3">© 2026 kratai</span>
					</div>
				</div>
			</footer>
		</div>
	);
}
