'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { regenerateViewAction } from '@/1_application/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Shown only for a view with no prior successful generation - a failed
 * *re*generation of an already-working view falls back to showing the
 * last good diagram instead (see ViewRepository.failGeneration). */
export function FailedPanel({
	viewId,
	error,
	className,
}: {
	viewId: string;
	error?: string;
	className?: string;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleRetry() {
		startTransition(async () => {
			await regenerateViewAction(viewId);
			router.refresh();
		});
	}

	return (
		<div className={cn('flex flex-col items-center justify-center gap-3 text-center', className)}>
			<p className="max-w-md text-sm text-ink-2">
				Diagram generation failed{error ? `: ${error}` : '.'}
			</p>
			<Button onClick={handleRetry} disabled={isPending}>
				{isPending ? 'Retrying…' : 'Retry'}
			</Button>
		</div>
	);
}
