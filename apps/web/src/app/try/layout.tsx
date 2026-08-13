import { LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { isSignInEnabled } from '@/1_application/auth';
import { signInAction } from '@/1_application/authActions';
import { Button } from '@/components/ui/button';

/**
 * Public nav for the anonymous "try a public repo" flow - this lives
 * outside app/(app), so it doesn't get that layout's Header (which assumes
 * a signed-in user and calls getCurrentUser()/getCurrentPlan()) or its auth
 * gate (see app/(app)/layout.tsx). Mirrors Header.tsx's own structure
 * (sticky/h-16/justify-between/px-6/backdrop-blur header, not a nested
 * max-w-7xl container) so this reads as the same app, not a different page
 * that happens to share a logo.
 */
export default function TryLayout({ children }: { children: React.ReactNode }) {
	const signInEnabled = isSignInEnabled();

	return (
		<div className="flex h-screen flex-col">
			<header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-surface/95 px-6 backdrop-blur-md">
				<Link href="/" className="flex items-center gap-3">
					<Image
						src="/logo-white.png"
						alt="kratai"
						width={28}
						height={28}
						className="opacity-90 light:invert"
					/>
					<span className="text-lg font-semibold text-ink">kratai</span>
				</Link>
				<nav className="flex items-center gap-6 text-sm font-medium">
					{signInEnabled ? (
						<form action={signInAction}>
							<Button type="submit" size="sm">
								<LogIn className="size-4" />
								Sign in with GitHub
							</Button>
						</form>
					) : (
						<Button asChild size="sm">
							<Link href="/dashboard">
								<LogIn className="size-4" />
								Dashboard
							</Link>
						</Button>
					)}
				</nav>
			</header>
			<main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
		</div>
	);
}
