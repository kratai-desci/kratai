import Image from 'next/image';
import Link from 'next/link';

import { getCurrentUser } from '@/1_application/queries';

import { ThemeToggle } from '../theme/ThemeToggle';
import { UserMenu } from './UserMenu';

export async function Header() {
	const user = await getCurrentUser();

	return (
		<header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-surface/95 px-6 backdrop-blur-md">
			<Link href="/dashboard" className="flex items-center gap-3">
				{/* White-rabbit-on-transparent asset - inverted in light mode so it
				    reads as a dark mark instead of disappearing on a light header. */}
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
				<Link href="/dashboard" className="text-ink-2 transition-colors hover:text-brand-ink">
					Dashboard
				</Link>
				<Link href="/new" className="text-ink-2 transition-colors hover:text-brand-ink">
					New Diagram
				</Link>
				<span className="rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-3">
					Demo data
				</span>
				<ThemeToggle />
				<UserMenu user={user} />
			</nav>
		</header>
	);
}
