'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoadingState } from '@/components/ui/loading-state';

const POLL_INTERVAL_MS = 3000;

/**
 * Shown when another request is already generating this view (a
 * concurrent tab, or a regenerate someone else triggered) - this render
 * itself never starts a worker (see generateAndCacheView's begin-lock
 * guard), it just waits and periodically checks whether that other
 * generation has finished.
 */
export function GeneratingPanel({ message, className }: { message: string; className?: string }) {
	const router = useRouter();

	useEffect(() => {
		const interval = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [router]);

	return <LoadingState message={message} className={className} />;
}
