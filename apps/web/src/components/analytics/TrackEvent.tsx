'use client';

import * as React from 'react';

import { trackEvent } from '@/lib/analytics/gtag';

/** Fires a single GA4 event once, on mount - drop into a page to track a
 * visit without turning the page itself into a Client Component. */
export function TrackEvent({ event }: { event: string }) {
	React.useEffect(() => {
		trackEvent(event);
	}, [event]);

	return null;
}
