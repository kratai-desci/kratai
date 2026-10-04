import { app } from 'electron';
import { KRATAI_WEB_URL } from './auth.js';

// "1.10.0" > "1.9.0": compared segment by segment as numbers, not as strings.
function isNewer(candidate: string, current: string): boolean {
	const a = candidate.split('.').map(Number);
	const b = current.split('.').map(Number);
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		const x = a[i] ?? 0;
		const y = b[i] ?? 0;
		if (x !== y) return x > y;
	}
	return false;
}

/**
 * Asks kratai.com for the latest published desktop release and compares it to
 * the running app. Never throws and never blocks anything: offline, a slow
 * server or a malformed answer all just mean "no update to show". Not
 * signed-in-only on purpose - the version file is public.
 */
export async function checkForUpdate(): Promise<{ version: string; current: string } | null> {
	try {
		const res = await fetch(new URL('/api/desktop/latest', KRATAI_WEB_URL), { signal: AbortSignal.timeout(4000) });
		if (!res.ok) return null;
		const { version } = await res.json() as { version?: unknown };
		const current = app.getVersion();
		if (typeof version !== 'string' || !/^\d+(\.\d+){0,2}$/.test(version) || !isNewer(version, current)) return null;
		return { version, current };
	} catch {
		return null;
	}
}
