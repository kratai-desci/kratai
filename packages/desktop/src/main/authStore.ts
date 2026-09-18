import * as fs from 'fs';
import * as path from 'path';
import { app, safeStorage } from 'electron';

const AUTH_FILE = 'auth.enc';

export interface StoredAuth {
	token: string;
	email: string | null;
}

function getAuthPath(): string {
	return path.join(app.getPath('userData'), AUTH_FILE);
}

/**
 * The device token minted by kratai-web's /api/auth/device/exchange (see
 * auth.ts) - a bearer credential for the user's hosted-credit account, so
 * encrypted at rest via safeStorage exactly like the BYOK key this
 * replaces (apiKeyStore.ts, now removed). email rides along purely so the
 * UI can show "Signed in as X" without a separate lookup.
 */
export function getStoredAuth(): StoredAuth | undefined {
	const filePath = getAuthPath();
	if (!fs.existsSync(filePath)) return undefined;
	try {
		return JSON.parse(safeStorage.decryptString(fs.readFileSync(filePath)));
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
	fs.writeFileSync(filePath, safeStorage.encryptString(JSON.stringify(auth)));
}
