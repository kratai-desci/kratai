'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { regenerateViewAction } from '@/1_application/actions';
import { Button } from '@/components/ui/button';

/**
 * Never triggers regeneration on its own - only this button click does.
 * The diagram behind it is already rendered and usable; staleness is
 * informational, not blocking. See apps/web/REQUIREMENTS.md's diagram
 * caching notes for why (a wait the user didn't ask for is upsetting, a
 * wait behind a click they made is expected).
 */
export function StaleBanner({ viewId }: { viewId: string }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleRegenerate() {
		startTransition(async () => {
			await regenerateViewAction(viewId);
			router.refresh();
		});
	}

	return (
		<div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-2 text-sm">
			<span className="text-ink-2">This diagram was generated from an older commit.</span>
			<Button size="sm" variant="secondary" onClick={handleRegenerate} disabled={isPending}>
				{isPending ? 'Regenerating…' : 'Regenerate'}
			</Button>
		</div>
	);
}
