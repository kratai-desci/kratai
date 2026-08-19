import * as path from 'path';
import { mergeJsonFile } from './mergeConfig.js';

export function setupCursor(workspacePath: string): void {
	mergeJsonFile(path.join(workspacePath, '.cursor', 'mcp.json'), 'mcpServers', 'kratai', {
		command: 'npx',
		args: ['-y', '@kratai/mcp-server', workspacePath]
	});

	console.log('Cursor: wrote .cursor/mcp.json (mcpServers.kratai)');
}
