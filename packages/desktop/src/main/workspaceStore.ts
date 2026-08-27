import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// Recovered as-is from the pre-removal desktop app - a small, self-contained
// helper, nothing about it depended on the old renderer/IPC layer that got
// replaced.
const RECENTS_FILE = 'recent-workspaces.json';
const MAX_RECENTS = 10;

function getRecentsPath(): string {
	return path.join(app.getPath('userData'), RECENTS_FILE);
}

export function listRecentWorkspaces(): string[] {
	const filePath = getRecentsPath();
	if (!fs.existsSync(filePath)) {
		return [];
	}
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		return (JSON.parse(content) as string[]).filter(p => fs.existsSync(p));
	} catch (error) {
		console.error('Error loading recent workspaces:', error);
		return [];
	}
}

export function addRecentWorkspace(workspacePath: string): void {
	const existing = listRecentWorkspaces().filter(p => p !== workspacePath);
	const updated = [workspacePath, ...existing].slice(0, MAX_RECENTS);
	fs.writeFileSync(getRecentsPath(), JSON.stringify(updated, null, 2), 'utf-8');
}
