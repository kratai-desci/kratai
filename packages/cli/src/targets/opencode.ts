import * as path from 'path';
import { mergeJsonFile } from './mergeConfig.js';

export function setupOpenCode(workspacePath: string): void {
	mergeJsonFile(path.join(workspacePath, 'opencode.json'), 'mcp', 'kratai', {
		type: 'local',
		command: ['npx', '-y', '@kratai/mcp-server', workspacePath],
		enabled: true
	});

	console.log('OpenCode: wrote opencode.json (mcp.kratai)');
}
