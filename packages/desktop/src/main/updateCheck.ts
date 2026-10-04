import { app, dialog, shell } from 'electron';
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

async function fetchLatestVersion(): Promise<string | null> {
	try {
		const res = await fetch(new URL('/api/desktop/latest', KRATAI_WEB_URL), { signal: AbortSignal.timeout(4000) });
		if (!res.ok) return null;
		const { version } = await res.json() as { version?: unknown };
		return typeof version === 'string' && /^\d+(\.\d+){0,2}$/.test(version) ? version : null;
	} catch {
		return null;
	}
}

/**
 * The launch-time check behind the shell's "update available" bar. Never
 * throws and never blocks anything: offline, a slow server or a malformed
 * answer all just mean "no update to show". Not signed-in-only on purpose -
 * the version file is public.
 */
export async function checkForUpdate(): Promise<{ version: string; current: string } | null> {
	const latest = await fetchLatestVersion();
	const current = app.getVersion();
	return latest !== null && isNewer(latest, current) ? { version: latest, current } : null;
}

/** Help > Check for Updates: unlike the quiet launch check, always answers. */
export async function checkForUpdatesFromMenu(): Promise<void> {
	const latest = await fetchLatestVersion();
	const current = app.getVersion();
	if (latest === null) {
		await dialog.showMessageBox({ type: 'info', message: "Couldn't check for updates", detail: 'kratai could not reach kratai.com. Check your connection and try again.', buttons: ['OK'] });
		return;
	}
	if (!isNewer(latest, current)) {
		await dialog.showMessageBox({ type: 'info', message: 'kratai is up to date', detail: `You have version ${current}, the latest.`, buttons: ['OK'] });
		return;
	}
	const { response } = await dialog.showMessageBox({
		type: 'info', message: `kratai ${latest} is available`, detail: `You have version ${current}. Download the new version from your kratai dashboard.`,
		buttons: ['Open dashboard', 'Later'], defaultId: 0, cancelId: 1
	});
	if (response === 0) void shell.openExternal(new URL('/dashboard', KRATAI_WEB_URL).toString());
}

/** Windows/Linux About box (macOS uses the standard About panel, which shows the same version). */
export async function showAbout(): Promise<void> {
	await dialog.showMessageBox({ type: 'info', title: 'About kratai', message: `kratai ${app.getVersion()}`, detail: 'Spec-driven development, grounded in your code.\nkratai.com', buttons: ['OK'] });
}
