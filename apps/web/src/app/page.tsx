import { Check, Clock, LogIn, Users2, Waypoints } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { isSignInEnabled } from '@/1_application/auth';
import { signInAction } from '@/1_application/authActions';
import { TrackEvent } from '@/components/analytics/TrackEvent';
import { ScrollLink } from '@/components/landing/ScrollLink';
import { Badge } from '@/components/ui/badge';
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
	title: 'kratai — PR Review on the Architecture',
	description: 'Every PR reviewed against your real architecture — for humans and AI.',
};

const STACK = ['TypeScript', 'JavaScript', 'Python', 'Java', 'PHP', 'Spring', 'Django', 'Next.js'];

const DIFFERENTIATORS: Array<{
	icon: LucideIcon;
	title: string;
	body?: ReactNode;
	bullets?: { text: string; bold: string }[];
}> = [
	{
		icon: Waypoints,
		title: 'Catches architectural drift',
		bullets: [
			{ text: 'Detects', bold: 'bloated controllers' },
			{ text: 'Detects', bold: 'over-engineered code' },
		],
	},
	{
		icon: Users2,
		title: 'Built for humans and AI',
		bullets: [
			{ text: 'Every change', bold: 'maps to the diagram' },
			{ text: 'AI agents get the same', bold: 'architectural context' },
		],
	},
];

const PLANS: Array<{
	name: string;
	price: string;
	priceSuffix?: string;
	priceNote: string;
	highlight?: boolean;
	features: { text: string; soon?: boolean }[];
}> = [
	{
		name: 'Free',
		price: '$0',
		priceNote: 'Free forever',
		features: [
			{ text: '1 repo connected for PR review' },
			{ text: 'Diagrams generated from real code' },
			{ text: 'Git diff highlighting on the diagram' },
			{ text: 'MCP server — AI agents get your real architecture context' },
			{ text: 'Navigate straight to the code' },
			{ text: 'Linters and SAST tools support' },
		],
	},
	{
		name: 'Pro',
		price: '$5',
		priceSuffix: '/month',
		priceNote: 'or $30/year — 50% off, limited time',
		highlight: true,
		features: [
			{ text: 'All Free plan features' },
			{ text: 'Unlimited repos — review PRs everywhere you work' },
			{ text: 'Framework enrichment — Spring, Django, Next.js, and more' },
			{ text: 'Multiple saved views per repo — API layer, domain, or custom slices' },
			{ text: 'Share review context with your team', soon: true },
			{ text: 'Desktop app access', soon: true },
		],
	},
];

function CornerFrame({ children }: { children: ReactNode }) {
	return (
		<div className="relative">
			<span className="pointer-events-none absolute -top-3 -left-3 size-6 border-t-2 border-l-2 border-brand-ink/60" />
			<span className="pointer-events-none absolute -top-3 -right-3 size-6 border-t-2 border-r-2 border-brand-ink/60" />
			<span className="pointer-events-none absolute -bottom-3 -left-3 size-6 border-b-2 border-l-2 border-brand-ink/60" />
			<span className="pointer-events-none absolute -right-3 -bottom-3 size-6 border-r-2 border-b-2 border-brand-ink/60" />
			{children}
		</div>
	);
}

function NodeList({ items }: { items: { text: string; bold: string }[] }) {
	return (
		<ul className="relative inline-block space-y-4 text-left text-base text-ink-2">
			<span className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-brand-ink/25" aria-hidden />
			{items.map((b, i) => (
				<li key={i} className="relative flex items-start gap-3">
					<span className="relative z-10 mt-1.5 size-[11px] shrink-0 border-2 border-brand-ink bg-surface" />
					<span>
						{b.text} <strong className="font-semibold text-ink">{b.bold}</strong>
					</span>
				</li>
			))}
		</ul>
	);
}

function SectionTag({ n }: { n: string }) {
	return <p className="mb-3 font-mono text-xs tracking-[0.2em] text-brand-ink/80">§ {n}</p>;
}

function SignInCTA({
	children,
	size = 'default',
	variant = 'primary',
	className,
}: {
	children: ReactNode;
	size?: 'default' | 'sm';
	variant?: 'primary' | 'ghost';
	className?: string;
}) {
	const signInEnabled = isSignInEnabled();
	if (signInEnabled) {
		return (
			<form action={signInAction}>
				<Button type="submit" size={size} variant={variant} className={className}>
					{children}
				</Button>
			</form>
		);
	}
	return (
		<Button asChild size={size} variant={variant} className={className}>
			<Link href="/dashboard">{children}</Link>
		</Button>
	);
}

export default function LandingPage() {
	return (
		<div
			className="min-h-screen"
			style={{
				backgroundImage:
					'linear-gradient(rgba(244,208,63,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(244,208,63,0.05) 1px, transparent 1px)',
				backgroundSize: '48px 48px',
			}}
		>
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
						<ScrollLink
							href="#features"
							className="hidden text-sm font-medium text-ink-2 hover:text-brand-ink sm:inline"
						>
							Features
						</ScrollLink>
						<ScrollLink
							href="#pricing"
							className="hidden text-sm font-medium text-ink-2 hover:text-brand-ink sm:inline"
						>
							Pricing
						</ScrollLink>
						<span className="hidden sm:inline-block">
							<SignInCTA size="sm" variant="ghost" className="h-auto p-0 text-sm font-medium hover:bg-transparent">
								Login
							</SignInCTA>
						</span>
						<SignInCTA size="sm">
							<LogIn className="size-4" />
							<span className="hidden sm:inline">Try kratai Free</span>
							<span className="sm:hidden">Try Free</span>
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
							Try kratai Free
						</SignInCTA>
					</div>
					<p className="mt-6 text-xs text-ink-3">Free to start, no credit card.</p>

					<div className="mt-16">
						<CornerFrame>
							<Image
								src="/screenshots/demo.gif"
								alt="kratai — PR review on the architecture diagram"
								width={1920}
								height={1080}
								className="rounded-lg border border-line shadow-2xl"
								priority
								unoptimized
							/>
						</CornerFrame>
					</div>
				</div>
			</section>

			{/* Differentiators */}
			<section id="features" className="scroll-mt-20 px-6 pb-24">
				<div className="mx-auto max-w-5xl space-y-20">
					<div className="grid gap-12 lg:grid-cols-2 lg:items-center">
						<div className="text-center sm:text-left">
							<SectionTag n="01" />
							<Waypoints className="mx-auto mb-5 size-8 text-brand-ink sm:mx-0" />
							<h3 className="mb-4 text-2xl font-bold text-ink md:text-3xl">{DIFFERENTIATORS[0].title}</h3>
							<NodeList items={DIFFERENTIATORS[0].bullets ?? []} />
						</div>
						<div>
							<CornerFrame>
								<Image
									src="/screenshots/pr_review_mockup_v2.png"
									alt="kratai leaving a PR review comment that flags architectural drift, with a link back to the architecture diagram"
									width={1304}
									height={1114}
									className="w-full rounded-lg border border-line shadow-xl"
								/>
							</CornerFrame>
						</div>
					</div>

					<div className="grid gap-12 lg:grid-cols-2 lg:items-center">
						<div className="lg:order-1">
							<CornerFrame>
								<Image
									src="/screenshots/demo_ss_1_cropped.png"
									alt="Architecture diagram with added, removed, and modified members highlighted directly on the class nodes"
									width={866}
									height={696}
									className="w-full rounded-lg border border-line shadow-xl"
								/>
							</CornerFrame>
						</div>
						<div className="text-center sm:text-left lg:order-2">
							<SectionTag n="02" />
							<Users2 className="mx-auto mb-5 size-8 text-brand-ink sm:mx-0" />
							<h3 className="mb-4 text-2xl font-bold text-ink md:text-3xl">{DIFFERENTIATORS[1].title}</h3>
							<NodeList items={DIFFERENTIATORS[1].bullets ?? []} />
						</div>
					</div>
				</div>
			</section>

			{/* Stack */}
			<section className="border-t border-line px-6 py-12">
				<p className="mx-auto max-w-5xl text-center text-sm text-ink-3">{STACK.join(' · ')}</p>
			</section>

			{/* Pricing */}
			<section id="pricing" className="scroll-mt-20 border-t border-line px-6 py-24">
				<div className="mx-auto max-w-4xl">
					<div className="mb-12 text-center">
						<h2 className="mb-3 text-3xl font-bold text-ink md:text-4xl">Simple pricing</h2>
						<p className="text-lg text-ink-2">Start free. Upgrade when you outgrow it.</p>
					</div>
					<div className="grid gap-6 sm:grid-cols-2">
						{PLANS.map((plan) => (
							<Card
								key={plan.name}
								className={`flex flex-col gap-6 ${plan.highlight ? 'border-brand/40' : ''}`}
							>
								<div>
									<h3 className="mb-2 text-xl font-semibold text-ink">{plan.name}</h3>
									<p className="text-3xl font-bold text-ink">
										{plan.price}
										{plan.priceSuffix && (
											<span className="text-base font-normal text-ink-3">{plan.priceSuffix}</span>
										)}
									</p>
									<div className="mt-2">
										<Badge variant={plan.highlight ? 'warning' : 'neutral'}>{plan.priceNote}</Badge>
									</div>
								</div>
								<ul className="flex flex-1 flex-col gap-3 text-sm text-ink-2">
									{plan.features.map((f) => (
										<li key={f.text} className="flex items-center justify-between gap-2">
											<span className="flex items-center gap-2">
												{f.soon ? (
													<Clock className="size-4 shrink-0 text-ink-3" />
												) : (
													<Check className="size-4 shrink-0 text-success-2" />
												)}
												<span className={f.soon ? 'text-ink-3' : ''}>{f.text}</span>
											</span>
											{f.soon && <Badge variant="neutral">Coming soon</Badge>}
										</li>
									))}
								</ul>
								<SignInCTA variant={plan.highlight ? 'primary' : 'ghost'}>
									<LogIn className="size-4" />
									Try kratai Free
								</SignInCTA>
								{plan.highlight && (
									<p className="-mt-4 text-center text-xs text-ink-3">Upgrade anytime after signing in.</p>
								)}
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Closing CTA */}
			<section className="border-t border-line px-6 py-24 text-center">
				<h2 className="mb-8 text-3xl font-bold text-ink md:text-4xl">
					Ready to Review <span className="text-brand-ink">on the Architecture</span>?
				</h2>
				<SignInCTA>
					<LogIn className="size-4" />
					Try kratai Free
				</SignInCTA>
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
						<ScrollLink href="#pricing" className="hover:text-brand-ink">
							Pricing
						</ScrollLink>
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
