import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const SEEN_FILE = 'onboarding-seen.json';

function getSeenPath(): string {
	return path.join(app.getPath('userData'), SEEN_FILE);
}

export function hasSeenOnboarding(): boolean {
	return fs.existsSync(getSeenPath());
}

export function markOnboardingSeen(): void {
	fs.writeFileSync(getSeenPath(), JSON.stringify({ seen: true }, null, 2), 'utf-8');
}
