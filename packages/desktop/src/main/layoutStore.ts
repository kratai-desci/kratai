import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const LAYOUT_FILE = 'layout.json';

function getLayoutPath(): string {
	return path.join(app.getPath('userData'), LAYOUT_FILE);
}

export function getLayout(): Record<string, unknown> {
	const filePath = getLayoutPath();
	if (!fs.existsSync(filePath)) return {};
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
	} catch (error) {
		console.error('Error loading layout:', error);
		return {};
	}
}

export function saveLayout(data: Record<string, unknown>): void {
	fs.writeFileSync(getLayoutPath(), JSON.stringify(data, null, 2), 'utf-8');
}
