'use client';

// A LOCAL, independent read of the env var - not imported from
// gtagConfig.ts. Confirmed via testing that importing a Server-Component-safe
// constant into a 'use client' file recreates the same problem from the
// other direction depending on which side ends up sharing the compiled
// module; a plain module worked for server usage (layout.tsx) but silently
// failed to inline into the client bundle at all, while marking that same
// module 'use client' fixed the client bundle but turned layout.tsx's usage
// into a broken opaque reference. Two independent `process.env.NEXT_PUBLIC_*`
// expressions - one here, one in gtagConfig.ts - each inlines correctly for
// its own bundle graph, since Next's substitution is a textual match on the
// literal expression within a file already known to belong to that graph.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
		dataLayer?: unknown[][];
	}
}

/**
 * Fires a GA4 event via the real window.gtag() function - not by pushing
 * to dataLayer directly. Extensive real-browser testing (network tab,
 * multiple event shapes) showed dataLayer.push(['event', ...]) always left
 * a correctly-shaped entry sitting in the array, in the right order after
 * 'config', yet never produced an actual network request. Once gtag.js has
 * loaded, it evidently only actively processes calls that go through
 * window.gtag() itself (which it wires up as the live handler) - entries
 * added straight to the array afterward just sit there inertly, visible on
 * inspection but never sent. Only real gtag(...) calls work.
 *
 * This relies on window.gtag already being defined, which the
 * beforeInteractive inline script in layout.tsx guarantees runs before
 * hydration - so by the time any Client Component's effect can call this,
 * gtag already exists. A no-op when GA isn't configured
 * (NEXT_PUBLIC_GA_MEASUREMENT_ID unset, see .env.example) or gtag is
 * somehow still unavailable.
 *
 * Returns whether the event actually got sent - callers that dedupe
 * "already tracked" state in storage (TrackSignup, TrackPurchase) need
 * this: persisting a "tracked" flag when this returns false would
 * permanently skip the real event later, since the flag never clears
 * itself.
 */
export function trackEvent(action: string, params?: Record<string, unknown>): boolean {
	if (typeof window === 'undefined' || !GA_MEASUREMENT_ID || !window.gtag) return false;
	// Actually vary the argument count, not just params' value - explicitly
	// passing `undefined` as a 3rd argument still counts toward
	// arguments.length inside gtag() (this is the same bug already found and
	// fixed once for the array-push version; it silently reappeared when this
	// function was rewritten to call gtag() directly, since gtag(x, y, params)
	// always passes 3 arguments regardless of whether params is undefined).
	if (params === undefined) {
		window.gtag('event', action);
	} else {
		window.gtag('event', action, params);
	}
	return true;
}
