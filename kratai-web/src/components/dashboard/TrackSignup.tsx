'use client';

import * as React from 'react';

import { trackEvent } from '@/lib/analytics/gtag';

// v2 - bumped because an earlier version of trackEvent() could return true
// (and so set this flag) without the event actually reaching GA4, leaving
// stale 'tracked' flags in already-tested browsers that would otherwise
// permanently suppress a real fire even after the underlying bug was fixed.
// A new key name means those old values are simply orphaned and ignored.
const STORAGE_KEY = 'signup-tracked-v2';

/**
 * Fires GA4's 'sign_up' once per browser. There's no persisted "new user"
 * flag in this app (JWT-only sessions, no adapter - see 3_infrastructure/
 * auth.ts), so isNewUser is a proxy: zero saved diagrams yet. That's true
 * for a genuinely new signup and also for a returning free user who never
 * created one - the localStorage guard caps it at one fire per browser
 * either way, which is the best available signal without adding a real
 * "first seen" record to the users collection.
 */
export function TrackSignup({ isNewUser }: { isNewUser: boolean }) {
	React.useEffect(() => {
		if (!isNewUser) return;

		let alreadyTracked = false;
		try {
			alreadyTracked = localStorage.getItem(STORAGE_KEY) === '1';
		} catch {
			// localStorage unavailable - fire anyway rather than silently drop the event.
		}
		if (alreadyTracked) return;

		const sent = trackEvent('sign_up');
		if (!sent) return;

		try {
			localStorage.setItem(STORAGE_KEY, '1');
		} catch {
			// localStorage unavailable - this browser just won't dedupe across visits.
		}
	}, [isNewUser]);

	return null;
}
