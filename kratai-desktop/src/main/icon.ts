import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

let cachedIconDataUri: string | undefined;

/**
 * Returns the app icon as a data: URI so it can be embedded directly in
 * generated diagram/git-changes HTML loaded via iframe srcdoc - a file://
 * reference would otherwise be blocked by the sandboxed iframe's origin.
 */
export function getIconDataUri(): string | undefined {
	if (cachedIconDataUri !== undefined) {
		return cachedIconDataUri;
	}
	try {
		const iconPath = path.join(app.getAppPath(), 'assets', 'icon.png');
		const buffer = fs.readFileSync(iconPath);
		cachedIconDataUri = `data:image/png;base64,${buffer.toString('base64')}`;
	} catch (error) {
		console.error('Error loading app icon:', error);
		cachedIconDataUri = undefined;
	}
	return cachedIconDataUri;
}
