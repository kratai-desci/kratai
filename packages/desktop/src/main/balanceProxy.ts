import { getDeviceToken, KRATAI_WEB_URL } from './auth.js';

export interface BalanceInfo {
	balanceCents: number;
	/** The signup credit baseline - lets the shell's meter show "how full",
	 * not just a raw dollar figure. */
	totalCents: number;
}

/**
 * Same relay shape as generateProxy.ts's calls, pointed at kratai-web's
 * device-token balance route - returns null rather than throwing when
 * signed out, since the shell just hides the balance display in that case
 * instead of surfacing an error (unlike generate/chat, this isn't a user-
 * initiated action that needs a "why did this fail" message).
 */
export async function getBalanceCents(): Promise<BalanceInfo | null> {
	const token = getDeviceToken();
	if (!token) return null;

	const res = await fetch(new URL('/api/account/device-balance', KRATAI_WEB_URL), {
		headers: { authorization: `Bearer ${token}` }
	});
	if (!res.ok) return null;
	const data = await res.json().catch(() => ({} as Record<string, unknown>));
	const { balanceCents, totalCents } = data as { balanceCents?: unknown; totalCents?: unknown };
	if (typeof balanceCents !== 'number' || typeof totalCents !== 'number') return null;
	return { balanceCents, totalCents };
}
