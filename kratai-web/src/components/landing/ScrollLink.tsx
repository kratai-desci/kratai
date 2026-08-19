'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';

// Plain <Link href="#id"> fights Next's own hash-scroll handling when the
// page also has smooth-scroll CSS - the two competing scroll animations
// cancel each other out mid-flight and the page lands short of the target.
// Handling the scroll ourselves and preventing Link's default avoids that.
export function ScrollLink({
	href,
	className,
	children,
}: {
	href: `#${string}`;
	className?: string;
	children: ReactNode;
}) {
	function handleClick(e: MouseEvent<HTMLAnchorElement>) {
		const el = document.getElementById(href.slice(1));
		if (!el) return;
		e.preventDefault();
		el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		history.pushState(null, '', href);
	}

	return (
		<Link href={href} className={className} onClick={handleClick}>
			{children}
		</Link>
	);
}
