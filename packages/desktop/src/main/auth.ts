import * as crypto from 'crypto';
import { shell } from 'electron';
import { getStoredAuth, saveStoredAuth } from './authStore.js';

// Overridable for pointing at a local kratai-web dev server instead of
// production - never hardcoded elsewhere in this module.
const KRATAI_WEB_URL = process.env.KRATAI_WEB_URL || 'https://kratai.com';

interface PendingLogin {
	codeVerifier: string;
	state: string;
}

// Module-level, not persisted - a login attempt that outlives the running
// process (app quit mid-flow) is expected to just fail and be retried, not
// resumed. Only one attempt is ever in flight; starting a new one
// invalidates whichever browser tab was mid-login for a previous one.
let pendingLogin: PendingLogin | undefined;

function base64url(buf: Buffer): string {
	return buf.toString('base64url');
}

/**
 * Kicks off the PKCE sign-in flow: opens the system browser to kratai-web's
 * /desktop-login with a code_challenge this process can later prove it
 * generated, by producing the matching code_verifier - see
 * handleAuthCallback for the other half. The UI (viewShell.ts) polls
 * getAuthStatus() afterward rather than being told synchronously, since
 * completion depends on the user finishing sign-in in their browser.
 */
export function startSignIn(): void {
	const codeVerifier = base64url(crypto.randomBytes(32));
	const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
	const state = base64url(crypto.randomBytes(16));
	pendingLogin = { codeVerifier, state };

	const url = new URL('/desktop-login', KRATAI_WEB_URL);
	url.searchParams.set('code_challenge', codeChallenge);
	url.searchParams.set('state', state);
	void shell.openExternal(url.toString());
}

// 'ignored' means this wasn't a real sign-in callback at all (an unrelated
// or malformed kratai:// URL) - distinct from 'failure' so index.ts's
// mandatory sign-in gate (welcomeScreen.ts's getSignInHTML) only shows an
// error for an actual failed attempt, never for an unrelated deep link.
export type AuthCallbackResult =
	| { status: 'ignored' }
	| { status: 'success' }
	| { status: 'failure'; message: string };

/**
 * Called by index.ts's open-url (macOS) / second-instance (Windows/Linux)
 * handler whenever a kratai://callback URL arrives - from a real sign-in,
 * or potentially from anywhere else (a webpage, an email link), so this
 * validates state against a pending attempt this process itself started
 * before trusting anything in the URL, and does nothing beyond the PKCE
 * exchange with whatever it finds. Returns a result (rather than just
 * logging and returning void, like this used to) because sign-in is now a
 * mandatory gate (index.ts's app.whenReady()) - a hard gate can't afford to
 * fail silently the way an optional nudge could.
 */
export async function handleAuthCallback(url: string): Promise<AuthCallbackResult> {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return { status: 'ignored' };
	}
	if (parsed.protocol !== 'kratai:' || parsed.hostname !== 'callback') return { status: 'ignored' };

	const code = parsed.searchParams.get('code');
	const state = parsed.searchParams.get('state');
	if (!code || !state || !pendingLogin || state !== pendingLogin.state) {
		console.error('[kratai auth] Sign-in callback rejected: no matching pending login.');
		return { status: 'failure', message: 'This sign-in link has expired - please try again.' };
	}

	const codeVerifier = pendingLogin.codeVerifier;
	pendingLogin = undefined; // single-use regardless of outcome below

	try {
		const res = await fetch(new URL('/api/auth/device/exchange', KRATAI_WEB_URL), {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ code, codeVerifier })
		});
		const data = await res.json() as { deviceToken?: string; email?: string | null; error?: string };
		if (!res.ok || !data.deviceToken) throw new Error(data.error || 'Sign-in failed.');
		saveStoredAuth({ token: data.deviceToken, email: data.email ?? null });
		return { status: 'success' };
	} catch (error) {
		console.error('[kratai auth] Sign-in exchange failed:', error);
		return { status: 'failure', message: 'Sign-in failed - please try again.' };
	}
}

export function getAuthStatus(): { signedIn: boolean; email: string | null } {
	const stored = getStoredAuth();
	return { signedIn: !!stored, email: stored?.email ?? null };
}

export function signOut(): void {
	// Clears the local credential only - no server-side revoke call yet
	// (that needs a device-list concept, planned but not built this phase).
	// Still a real sign-out from this device's point of view.
	saveStoredAuth(undefined);
}

export function getDeviceToken(): string | undefined {
	return getStoredAuth()?.token;
}

export { KRATAI_WEB_URL };
