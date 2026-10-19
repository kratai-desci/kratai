import * as fs from 'fs';
import * as path from 'path';

const HEADING = '# kratai: personal files, not shared with your team';

/** True when the folder, or any folder above it, is part of a git repository. */
function insideGitRepo(folder: string): boolean {
	for (let dir = path.resolve(folder); ; dir = path.dirname(dir)) {
		if (fs.existsSync(path.join(dir, '.git'))) return true;
		if (path.dirname(dir) === dir) return false;
	}
}

/**
 * Keeps one of kratai's personal files (the chat history, the personal settings) out of the project's
 * git repository, so that teammates opening the same repo do not commit or fight over each other's.
 * Adds the file's name to the folder's `.gitignore` - once, never touching anything already there -
 * and only when the folder is in a git repository (no `.gitignore` is created for a plain folder). A
 * file that was committed earlier stays tracked: ignoring never removes it from git, that is the
 * team's call. Never throws: a read-only folder just means the line is not added.
 */
export function keepOutOfGit(workspacePath: string, fileName: string): void {
	try {
		if (!insideGitRepo(workspacePath)) return;
		const ignorePath = path.join(workspacePath, '.gitignore');
		const existing = fs.existsSync(ignorePath) ? fs.readFileSync(ignorePath, 'utf-8') : '';
		const alreadyListed = existing.split(/\r?\n/).some(line => line.trim().replace(/^\//, '') === fileName);
		if (alreadyListed) return;
		const eol = existing.includes('\r\n') ? '\r\n' : '\n';
		const lead = existing === '' || existing.endsWith('\n') ? '' : eol;
		const heading = existing.includes(HEADING) ? '' : `${existing === '' ? '' : eol}${HEADING}${eol}`;
		fs.appendFileSync(ignorePath, `${lead}${heading}${fileName}${eol}`, 'utf-8');
	} catch {
		// Not being able to edit .gitignore must never get in the way of saving the file itself.
	}
}
