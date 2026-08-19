'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const POLL_INTERVAL_MS = 3000;

/**
 * Shown over an already-rendered (possibly stale) diagram while a
 * generation is in flight - either this view's own regenerate, or one
 * someone else triggered from another tab. Keeps the last good diagram
 * visible instead of blanking the page; polls until the status moves on.
 */
export function RegeneratingBanner() {
	const router = useRouter();

	useEffect(() => {
		const interval = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [router]);

	return (
		<div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface-2 px-4 py-2 text-sm text-ink-2">
			<Loader2 className="size-4 animate-spin text-brand" />
			Regenerating this diagram…
		</div>
	);
}
