import * as fs from 'fs';
import * as path from 'path';
import { mergeJsonFile } from './mergeConfig.js';

export function setupClaudeCode(workspacePath: string, skillContent: string): void {
	mergeJsonFile(path.join(workspacePath, '.mcp.json'), 'mcpServers', 'kratai', {
		command: 'npx',
		args: ['-y', '@kratai/mcp-server', workspacePath]
	});

	const skillDir = path.join(workspacePath, '.claude', 'skills', 'kratai');
	fs.mkdirSync(skillDir, { recursive: true });
	fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent, 'utf-8');

	console.log('Claude Code: wrote .mcp.json (mcpServers.kratai) and .claude/skills/kratai/SKILL.md');
}
