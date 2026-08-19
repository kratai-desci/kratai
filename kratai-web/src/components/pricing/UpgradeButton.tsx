'use client';

import { useState, useTransition } from 'react';

import { createCheckoutSessionAction } from '@/1_application/billing';
import type { BillingInterval } from '@/2_domain';
import { Button } from '@/components/ui/button';

/**
 * createCheckoutSessionAction redirects server-side - to real Stripe
 * Checkout when configured, straight to the success page otherwise
 * (REQUIREMENTS.md §9.3) - so this component never needs to know which
 * happened or call router.push itself; Next's client runtime handles the
 * redirect() transparently. Only genuine errors (a Stripe API failure)
 * surface here as a message.
 */
export function UpgradeButton({ interval, label }: { interval: BillingInterval; label: string }) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function handleClick() {
		setError(null);
		startTransition(async () => {
			try {
				await createCheckoutSessionAction(interval);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
			}
		});
	}

	return (
		<div className="flex flex-1 flex-col items-center gap-2">
			<Button
				className="w-full"
				variant={interval === 'year' ? 'primary' : 'secondary'}
				onClick={handleClick}
				disabled={isPending}
			>
				{isPending ? 'Redirecting...' : label}
			</Button>
			{error && <p className="text-center text-xs text-danger-2">{error}</p>}
		</div>
	);
}
