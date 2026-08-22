import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { setupClaudeCode } from '../targets/claudeCode.js';
import { setupAgentsMd } from '../targets/agentsMd.js';

// esbuild bundles this into a single out/cli.mjs, so import.meta.url here
// resolves to that bundle's own location regardless of this file's original
// path - out/SKILL.md (copied alongside it by copy-skill.js) is a sibling.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface InitOptions {
	path: string;
}

// No per-host branching anymore - AGENTS.md alone already covers Cursor
// (reads it natively) and OpenCode (falls back to it), so the only thing
// left that's Claude-Code-specific is also dropping a copy of the skill
// into .claude/skills/kratai/, which is harmless to write even for a
// non-Claude-Code project.
export function runInit(options: InitOptions): void {
	const workspacePath = path.resolve(options.path);

	if (!fs.existsSync(workspacePath)) {
		throw new Error(`Path not found: ${workspacePath}`);
	}

	const skillPath = path.join(__dirname, 'SKILL.md');
	if (!fs.existsSync(skillPath)) {
		throw new Error('Bundled SKILL.md not found - this indicates a broken @kratai/cli install.');
	}
	const skillContent = fs.readFileSync(skillPath, 'utf-8');

	setupClaudeCode(workspacePath, skillContent);
	setupAgentsMd(workspacePath, skillContent);

	console.log(`\nkratai wired up in ${workspacePath}`);
}
