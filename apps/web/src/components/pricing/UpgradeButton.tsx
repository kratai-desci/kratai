'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

/**
 * No real payment processor is wired up yet (REQUIREMENTS.md §9.3) - a fake
 * checkout UI here would just be throwaway work, since the real one will be
 * entirely dictated by whichever processor's own Checkout/Elements
 * components get integrated. This is a placeholder for that click, not a
 * preview of what checkout will look like.
 */
export function UpgradeButton() {
	const [clicked, setClicked] = useState(false);

	return (
		<div className="flex flex-col items-center gap-2">
			<Button className="w-full" onClick={() => setClicked(true)} disabled={clicked}>
				Upgrade to Pro
			</Button>
			{clicked && (
				<p className="text-center text-xs text-ink-3">
					Payments aren&apos;t wired up yet - check back soon.
				</p>
			)}
		</div>
	);
}
