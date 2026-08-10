import Image from 'next/image';
import Link from 'next/link';

import type { User } from '@/2_domain';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Badge } from '@/components/ui/badge';
import { UserMenu } from '@/components/layout/UserMenu';

// Visual clone of components/layout/Header.tsx for the /mock UI-only tree.
// The real Header calls getCurrentUser()/getCurrentPlan() and assumes the
// (app) layout's auth redirect already ran - both real session-dependent
// calls that would misbehave with no session here. /mock intentionally
// sits outside (app) (no auth gate, always reachable) so this uses fixed
// mock data instead, keeping the exact same markup/classes as prod.
const MOCK_USER: User = {
	id: 'mock-user',
	name: 'Jordan Brooks',
	username: 'jbrooks215',
	email: 'jordan@example.com',
	avatarUrl: null,
};

function MockHeader() {
	return (
		<header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-surface/95 px-6 backdrop-blur-md">
			<Link href="/mock/dashboard" className="flex items-center gap-3">
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
				<Link href="/mock/dashboard" className="text-ink-2 transition-colors hover:text-brand-ink">
					Dashboard
				</Link>
				<Badge variant="brand">Pro</Badge>
				<span className="rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-3">
					Mock UI
				</span>
				<ThemeToggle />
				<UserMenu user={MOCK_USER} />
			</nav>
		</header>
	);
}

export default function MockLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex h-screen flex-col">
			<MockHeader />
			<main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
		</div>
	);
}
