'use client';

import * as React from 'react';

import type { BillingInterval } from '@/2_domain';
import { trackEvent } from '@/lib/analytics/gtag';

/**
 * Both real Stripe Checkout and the mocked purchase flow (billing.ts,
 * REQUIREMENTS.md §9.3) redirect here on success, so this is the one place
 * that needs to fire 'purchase_pro' - no webhook/Measurement Protocol
 * plumbing required. sessionStorage guards against a refresh of this page
 * double-counting the same purchase.
 *
 * Key is versioned (v2) for the same reason as TrackSignup's - an earlier
 * trackEvent() could return true without the event actually reaching GA4,
 * leaving stale 'tracked' flags that would otherwise permanently suppress
 * a real fire even after the underlying bug was fixed.
 */
export function TrackPurchase({ interval }: { interval: BillingInterval }) {
	React.useEffect(() => {
		const storageKey = `purchase-tracked-v2-${interval}`;

		let alreadyTracked = false;
		try {
			alreadyTracked = sessionStorage.getItem(storageKey) === '1';
		} catch {
			// sessionStorage unavailable - fire anyway rather than silently drop the event.
		}
		if (alreadyTracked) return;

		const sent = trackEvent('purchase_pro', {
			billing_interval: interval,
			value: interval === 'year' ? 30 : 5,
			currency: 'USD',
		});
		if (!sent) return;

		try {
			sessionStorage.setItem(storageKey, '1');
		} catch {
			// sessionStorage unavailable - a refresh of this page may double-count.
		}
	}, [interval]);

	return null;
}
