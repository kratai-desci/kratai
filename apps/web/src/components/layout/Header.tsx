import Image from 'next/image';
import Link from 'next/link';

export function Header() {
	return (
		<header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-line bg-surface/95 px-6 backdrop-blur-md">
			<Link href="/dashboard" className="flex items-center gap-3">
				<Image src="/logo-white.png" alt="kratai" width={28} height={28} className="opacity-90" />
				<span className="text-lg font-semibold text-ink">kratai</span>
			</Link>
			<nav className="flex items-center gap-6 text-sm font-medium">
				<Link href="/dashboard" className="text-ink-2 transition-colors hover:text-brand">
					Dashboard
				</Link>
				<Link href="/new" className="text-ink-2 transition-colors hover:text-brand">
					New Diagram
				</Link>
				<span className="rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-3">
					Demo data
				</span>
			</nav>
		</header>
	);
}
