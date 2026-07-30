'use client';

import { AlertTriangle } from 'lucide-react';
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
 *
 * Deliberately theme-invariant (fixed dark bg + yellow text/icon in both
 * light and dark mode, rather than the adaptive bg-warning/15 +
 * text-warning-2 pair used elsewhere) - a hazard-stripe look reads as
 * "pay attention" more clearly than a tinted wash, and doesn't fade into
 * either theme's surface color.
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
		<div className="flex shrink-0 items-center justify-between gap-3 border-b border-warning/40 bg-[#333333] px-4 py-2 text-sm">
			<span className="flex items-center gap-2 text-warning">
				<AlertTriangle className="size-4 shrink-0" />
				This diagram was generated from an older commit.
			</span>
			<Button size="sm" variant="primary" onClick={handleRegenerate} disabled={isPending}>
				{isPending ? 'Regenerating…' : 'Regenerate'}
			</Button>
		</div>
	);
}
