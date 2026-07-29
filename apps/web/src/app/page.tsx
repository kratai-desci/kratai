import { LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { isSignInEnabled } from '@/1_application/auth';
import { signInAction } from '@/1_application/authActions';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
	const signInEnabled = isSignInEnabled();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
			<Image
				src="/logo-white.png"
				alt="kratai"
				width={64}
				height={64}
				className="mb-8 opacity-90 light:invert"
			/>
			<h1 className="max-w-2xl text-5xl font-bold text-ink">
				Architecture diagrams for your <span className="text-brand-ink">GitHub repos</span>
			</h1>
			<p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
				Pick a repo and branch, generate an interactive architecture diagram from the real code
				structure, and export it as Markdown to give AI agents accurate context.
			</p>
			<div className="mt-10 flex items-center gap-4">
				{signInEnabled ? (
					<form action={signInAction}>
						<Button type="submit" size="default">
							<LogIn className="size-4" />
							Continue with GitHub
						</Button>
					</form>
				) : (
					<Button asChild size="default">
						<Link href="/dashboard">
							<LogIn className="size-4" />
							Continue with GitHub
						</Link>
					</Button>
				)}
			</div>
			<p className="mt-6 text-xs text-ink-3">
				{signInEnabled
					? 'Sign in with your GitHub account to get started.'
					: "This is a UI preview running on demo data - sign-in isn't wired up yet."}
			</p>
		</div>
	);
}
