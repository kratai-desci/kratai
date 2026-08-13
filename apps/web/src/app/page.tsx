import { Bot, Check, FileCode2, Layers, LogIn, MousePointerClick, Server, ShieldCheck } from 'lucide-react';
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
					<div className="hidden items-center gap-8 md:flex">
						<a href="#features" className="text-sm font-medium text-ink-2 hover:text-brand-ink">
							Features
						</a>
						<a href="#tour" className="text-sm font-medium text-ink-2 hover:text-brand-ink">
							Visual Tour
						</a>
						<a href="#languages" className="text-sm font-medium text-ink-2 hover:text-brand-ink">
							Languages
						</a>
						<Link href="/pricing" className="text-sm font-medium text-ink-2 hover:text-brand-ink">
							Pricing
						</Link>
						<SignInCTA size="sm">
							<LogIn className="size-4" />
							Sign in with GitHub
						</SignInCTA>
					</div>
				</div>
			</nav>

			{/* Hero */}
			<section className="relative flex min-h-screen items-center justify-center px-6 py-20">
				<div className="mx-auto max-w-6xl text-center">
					<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-panel px-4 py-2">
						<span className="text-sm font-medium text-brand-ink">
							⚡ 49% fewer tokens • 58% lower costs • 70% faster
						</span>
					</div>

					<h1 className="mb-6 text-5xl leading-tight font-bold text-ink md:text-6xl lg:text-7xl">
						The Architectural Oversight Layer
						<br />
						<span className="text-brand-ink">for Your GitHub Repos</span>
					</h1>
					<p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-ink-2">
						You focus on design. AI writes the code like a real software engineer.
						<br />
						<span className="text-brand-ink/80">
							Living architecture diagrams keep AI agents aligned — dramatically reducing token usage
						</span>
					</p>
					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<SignInCTA>
							<LogIn className="size-4" />
							Sign in with GitHub
						</SignInCTA>
					</div>
					<p className="mt-6 text-xs text-ink-3">Free to start, no credit card.</p>

					<div className="mx-auto mt-12 max-w-lg">
						<p className="mb-3 text-sm text-ink-3">
							Or paste a public repo and see it right now — no sign-in
						</p>
						<TryRepoForm />
					</div>

					<div className="mt-16">
						<Image
							src="/screenshots/demo.gif"
							alt="kratai in action - interactive code visualization"
							width={1920}
							height={1080}
							className="rounded-lg border border-line shadow-2xl"
							priority
							unoptimized
						/>
					</div>
				</div>
			</section>

			{/* Proven Performance */}
			<section className="bg-surface-2 px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-12 text-center">
						<h2 className="mb-4 text-4xl font-bold text-ink md:text-5xl">
							Proven <span className="text-brand-ink">Performance</span>
						</h2>
						<p className="mx-auto max-w-2xl text-xl text-ink-2">
							Early benchmarks show dramatic improvements when AI agents use kratai&apos;s
							architecture context
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						{[
							{ stat: '49%', label: 'Fewer Tokens', body: 'Reduction in output tokens generated' },
							{ stat: '66%', label: 'Less Input', body: 'Reduction in total input tokens' },
							{ stat: '58%', label: 'Lower Costs', body: 'Reduction in billing units' },
							{ stat: '70%', label: 'Faster', body: 'Faster completion time' },
						].map((m) => (
							<Card key={m.label} className="p-8 text-center">
								<div className="mb-2 text-5xl font-bold text-brand-ink">{m.stat}</div>
								<h3 className="mb-2 text-xl font-semibold text-ink">{m.label}</h3>
								<p className="text-sm text-ink-2">{m.body}</p>
							</Card>
						))}
					</div>

					<p className="mt-8 text-center text-sm text-ink-3 italic">
						* Results from preliminary internal testing (kratai v.1.9.4 vs no skill baseline).
						Actual results may vary depending on task complexity and agent behavior.
					</p>
				</div>
			</section>

			{/* Key Features (Visual Tour) */}
			<section id="tour" className="px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-16 text-center">
						<h2 className="mb-4 text-4xl font-bold text-ink md:text-5xl">
							Key <span className="text-brand-ink">Features</span>
						</h2>
						<p className="mx-auto max-w-2xl text-xl text-ink-2">
							From architecture truth to AI integration — see how it works
						</p>
					</div>

					<div className="space-y-20">
						{[
							{
								title: 'Built-in Coding Agent & SKILL',
								body: 'Pre-configured SKILL teaches AI to follow your design principles automatically. Local MCP server provides direct access to architecture data — no manual setup required.',
								bullets: [
									'Automatic pattern recognition',
									'Follows KISS, DRY, SRP principles',
									'Minimal lines of code, high cohesion',
								],
								image: '/screenshots/demo_ss_4.png',
								imageFirst: false,
								imageWidth: 800,
								imageHeight: 450,
							},
							{
								title: 'AI Understands Your Architecture',
								body: 'AI agents query your architecture before generating code. No expensive context dumps — AI gets structured, accurate system information through MCP server.',
								bullets: [
									'Direct access to living architecture diagrams',
									'Massive token reduction vs raw file dumps',
									'No hallucinations, always accurate',
								],
								image: '/screenshots/demo_ss_1.png',
								imageFirst: true,
								imageWidth: 800,
								imageHeight: 450,
							},
							{
								title: 'Create Different Architectural Views',
								body: 'Save different perspectives for different needs — focus on domains, API layers, or specific features. Each diagram is a lens into your system structure.',
								bullets: [
									'Multiple saved configurations',
									'Switch instantly between views',
									'Git diff highlighting',
								],
								image: '/screenshots/demo_ss_2.png',
								imageFirst: false,
								// Matches the landing-page project's own sizing for this
								// specific screenshot - smaller than the other three there too.
								imageWidth: 400,
								imageHeight: 281,
							},
							{
								title: 'Fine-Grained Control',
								body: 'Choose exactly what to show — select folders, filter relationship types, and control class types. Tailor each diagram to your specific needs.',
								bullets: [
									'24 relationship types to filter',
									'4 class types (Class, Interface, Module, Other)',
									'Click to jump directly to code',
								],
								image: '/screenshots/demo_ss_5.png',
								imageFirst: true,
								imageWidth: 800,
								imageHeight: 450,
							},
						].map((item) => (
							<div key={item.title} className="grid items-center gap-12 md:grid-cols-2">
								<div className={item.imageFirst ? 'md:order-2' : 'md:order-1'}>
									<h3 className="mb-4 text-3xl font-bold text-ink">{item.title}</h3>
									<p className="mb-6 text-lg leading-relaxed text-ink-2">{item.body}</p>
									<ul className="space-y-3 text-ink-2">
										{item.bullets.map((b) => (
											<li key={b} className="flex items-start gap-3">
												<Check className="mt-0.5 size-5 shrink-0 text-success-2" />
												<span>{b}</span>
											</li>
										))}
									</ul>
								</div>
								<div className={item.imageFirst ? 'md:order-1' : 'md:order-2'}>
									<Image
										src={item.image}
										alt={item.title}
										width={item.imageWidth}
										height={item.imageHeight}
										className="rounded-lg border border-line shadow-2xl"
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Detailed Features */}
			<section id="features" className="px-6 py-20">
				<div className="mx-auto max-w-7xl">
					<div className="mb-16 text-center">
						<h2 className="mb-4 text-4xl font-bold text-ink md:text-5xl">
							Detailed <span className="text-brand-ink">Features</span>
						</h2>
						<p className="mx-auto max-w-2xl text-xl text-ink-2">
							Accurate architecture diagrams, AI integration, and multi-language support
						</p>
					</div>

					{/* AI Integration */}
					<div className="mb-12">
						<h3 className="mb-8 text-3xl font-bold text-ink">
							AI Integration via SKILL &amp; Local MCP Server
						</h3>
						<div className="grid gap-8 md:grid-cols-3">
							{[
								{
									icon: Bot,
									title: 'Architecture-Aware SKILL',
									body: 'Pre-configured skill teaches AI to analyze existing patterns and follow your design principles automatically. No manual prompting required.',
								},
								{
									icon: Server,
									title: 'Local MCP Server',
									body: 'Built-in Model Context Protocol server gives AI agents direct access to your architecture diagrams. AI can query your system structure before generating code, understanding the full context.',
								},
								{
									icon: ShieldCheck,
									title: 'Software Engineering Principles',
									body: 'Ensure coding AIs consider foundational software engineering principles (KISS, DRY, SRP, high cohesion, low coupling) to produce minimal lines of code and maintain architectural integrity.',
								},
							].map((f) => (
								<Card key={f.title} className="flex flex-col gap-4 p-8">
									<div className="flex size-12 items-center justify-center rounded-lg bg-brand/10">
										<f.icon className="size-6 text-brand-ink" />
									</div>
									<h4 className="text-xl font-semibold text-ink">{f.title}</h4>
									<p className="leading-relaxed text-ink-2">{f.body}</p>
								</Card>
							))}
						</div>
					</div>

					{/* Architecture Intelligence */}
					<div className="mb-12">
						<h3 className="mb-8 text-3xl font-bold text-ink">Architecture Intelligence</h3>
						<div className="grid gap-8 md:grid-cols-3">
							{[
								{
									icon: Layers,
									title: 'Deterministic Analysis',
									body: 'Generate interactive architecture diagrams directly from your codebase using static analysis. No LLM tokens required, no hallucinations, always reflects the actual code structure.',
								},
								{
									icon: FileCode2,
									title: 'Single Source of Truth',
									body: 'Diagrams represent the real state of your system, making it easy for developers to understand the overall architecture and reducing token costs when AI agents need context.',
								},
								{
									icon: MousePointerClick,
									title: 'Developer-Friendly Navigation',
									body: 'Git diff highlighting shows uncommitted changes at a glance. Click any element to jump directly to the code.',
								},
							].map((f) => (
								<Card key={f.title} className="flex flex-col gap-4 p-8">
									<div className="flex size-12 items-center justify-center rounded-lg bg-brand/10">
										<f.icon className="size-6 text-brand-ink" />
									</div>
									<h4 className="text-xl font-semibold text-ink">{f.title}</h4>
									<p className="leading-relaxed text-ink-2">{f.body}</p>
								</Card>
							))}
						</div>
					</div>

					{/* Language & Framework Support */}
					<div id="languages">
						<h3 className="mb-8 text-3xl font-bold text-ink">Language &amp; Framework Support</h3>
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
				</div>
			</section>

			{/* Spec-Driven Development */}
			<section className="bg-surface-2 px-6 py-20">
				<div className="mx-auto max-w-5xl">
					<div className="mb-12 text-center">
						<h2 className="mb-4 text-4xl font-bold text-ink md:text-5xl">
							<span className="text-brand-ink">Spec-Driven</span> Development
						</h2>
						<p className="mx-auto max-w-3xl text-xl text-ink-2">
							Architecture as a first-class artifact, not an afterthought
						</p>
					</div>

					<Card className="p-8 md:p-12">
						<p className="mb-6 text-lg leading-relaxed text-ink-2">
							Spec-Driven Development (SDD) treats <strong className="text-ink">specifications and
							architecture</strong> as primary artifacts that guide development, instead of starting
							with code and hoping the structure emerges correctly.
						</p>

						<div className="mb-6 rounded-lg border-l-4 border-brand bg-surface p-6">
							<h4 className="mb-3 text-xl font-semibold text-ink">
								Working with AI without a shared architecture reference tends to lead to:
							</h4>
							<ul className="space-y-2 text-ink-2">
								<li className="flex items-start gap-3">
									<span className="text-warning-2">⚠️</span>
									<span>Inconsistent architectural decisions from one session to the next</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-warning-2">⚠️</span>
									<span>Difficulty seeing the overall system structure at a glance</span>
								</li>
								<li className="flex items-start gap-3">
									<span className="text-warning-2">⚠️</span>
									<span>Technical debt that quietly accumulates as generated code piles up</span>
								</li>
							</ul>
						</div>

						<p className="mb-6 text-lg leading-relaxed text-ink-2">
							SDD makes both <strong className="text-ink">what</strong> the system should do and{' '}
							<strong className="text-ink">how</strong> it&apos;s structured explicit and actionable —
							a stronger foundation for AI-assisted work to build on.
						</p>

						<div className="rounded-lg border border-brand/30 bg-brand/10 p-6">
							<h4 className="mb-3 flex items-center gap-2 text-xl font-semibold text-brand-ink">
								<ShieldCheck className="size-5" />
								kratai&apos;s role in SDD
							</h4>
							<p className="leading-relaxed text-ink-2">
								kratai gives you clear visibility into how your system is actually structured, so you
								can keep architectural intent aligned with what&apos;s really in the repo — and hand
								that same accurate picture to an AI agent instead of letting it guess.
							</p>
						</div>
					</Card>
				</div>
			</section>

			{/* CTA */}
			<section className="px-6 py-20">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="mb-6 text-4xl font-bold text-ink md:text-5xl">
						Ready to <span className="text-brand-ink">Understand</span> Your Codebase?
					</h2>
					<p className="mb-10 text-xl leading-relaxed text-ink-2">
						Sign in with GitHub and generate your first diagram in minutes.
					</p>
					<div className="flex flex-col justify-center gap-4 sm:flex-row">
						<SignInCTA>
							<LogIn className="size-4" />
							Sign in with GitHub
						</SignInCTA>
					</div>
				</div>
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
									<Link href="/pricing" className="hover:text-brand-ink">
										Pricing
									</Link>
								</li>
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
