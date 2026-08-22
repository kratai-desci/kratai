import * as fs from 'fs';
import * as path from 'path';

export function setupClaudeCode(workspacePath: string, skillContent: string): void {
	const skillDir = path.join(workspacePath, '.claude', 'skills', 'kratai');
	fs.mkdirSync(skillDir, { recursive: true });
	fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent, 'utf-8');

	console.log('Claude Code: wrote .claude/skills/kratai/SKILL.md');
}
