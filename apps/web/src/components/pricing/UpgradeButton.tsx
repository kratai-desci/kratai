'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { setMockPlanAction } from '@/1_application/planActions';
import type { BillingInterval } from '@/1_application/plan';
import { Button } from '@/components/ui/button';

/**
 * No real payment processor is wired up yet (REQUIREMENTS.md §9.3) - a real
 * Stripe Checkout redirect here would just be a dead end, so this instead
 * simulates the whole loop: flips the mock plan (same mechanism as the
 * profile page's dev toggle) and lands on a success page, so the full
 * upgrade → confirmation → manage-billing path can actually be reviewed,
 * not just a disabled button. `interval` is real, not cosmetic - it's what
 * the success/billing pages use to show a plausible price, and it's what a
 * real integration would map to a specific Stripe Price id.
 */
export function UpgradeButton({ interval, label }: { interval: BillingInterval; label: string }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleClick() {
		startTransition(async () => {
			await setMockPlanAction('pro', interval);
			router.push(`/pricing/success?interval=${interval}`);
		});
	}

	return (
		<Button
			className="w-full flex-1"
			variant={interval === 'year' ? 'primary' : 'secondary'}
			onClick={handleClick}
			disabled={isPending}
		>
			{isPending ? 'Processing...' : label}
		</Button>
	);
}
