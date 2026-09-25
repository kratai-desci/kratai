import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const AUTH_FILE = 'auth.json';

export interface StoredAuth {
	token: string;
	email: string | null;
}

function getAuthPath(): string {
	return path.join(app.getPath('userData'), AUTH_FILE);
}

/**
 * The device token minted by kratai-web's /api/auth/device/exchange (see
 * auth.ts) - a bearer credential for the user's hosted-credit account,
 * revocable server-side, not a password. Stored as a plain file guarded by
 * the OS's own per-user file permissions, same as kratai.local.json's
 * workspace prefs - previously went through safeStorage (OS Keychain), but
 * that's the wrong tradeoff for a revocable session token: it forces every
 * user through an unexplained "wants to use your confidential information"
 * system prompt, and denying it fails sign-in silently (safeStorage throws,
 * caught, logged to console only - the user just never gets signed in with
 * no indication why). Common practice for this exact kind of
 * server-revocable session credential (Slack, Discord, VS Code, etc.) is
 * plain local storage, reserving Keychain-backed encryption for apps where
 * the secret itself is the product (password managers), where users
 * actually expect that prompt. email rides along purely so the UI can show
 * "Signed in as X" without a separate lookup.
 */
export function getStoredAuth(): StoredAuth | undefined {
	const filePath = getAuthPath();
	if (!fs.existsSync(filePath)) return undefined;
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
	} catch (error) {
		console.error('Error loading auth:', error);
		return undefined;
	}
}

export function saveStoredAuth(auth: StoredAuth | undefined): void {
	const filePath = getAuthPath();
	if (!auth) {
		if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
		return;
	}
	fs.writeFileSync(filePath, JSON.stringify(auth), 'utf-8');
}
