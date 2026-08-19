import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { setupClaudeCode } from '../targets/claudeCode.js';
import { setupCursor } from '../targets/cursor.js';
import { setupOpenCode } from '../targets/opencode.js';
import { setupAgentsMd } from '../targets/agentsMd.js';

// esbuild bundles this into a single out/cli.mjs, so import.meta.url here
// resolves to that bundle's own location regardless of this file's original
// path - out/SKILL.md (copied alongside it by copy-skill.js) is a sibling.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type InitTarget = 'claude' | 'cursor' | 'opencode' | 'all';

export interface InitOptions {
	path: string;
	target: InitTarget;
}

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

	const targets: Exclude<InitTarget, 'all'>[] = options.target === 'all'
		? ['claude', 'cursor', 'opencode']
		: [options.target];

	if (targets.includes('claude')) {
		setupClaudeCode(workspacePath, skillContent);
	}
	if (targets.includes('cursor')) {
		setupCursor(workspacePath);
	}
	if (targets.includes('opencode')) {
		setupOpenCode(workspacePath);
	}

	setupAgentsMd(workspacePath, skillContent);

	console.log(`\nkratai wired up for: ${targets.join(', ')} in ${workspacePath}`);
}
