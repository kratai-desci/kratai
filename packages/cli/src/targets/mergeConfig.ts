import * as fs from 'fs';
import * as path from 'path';

/**
 * Reads a JSON config file if it exists, sets data[key][subKey] = value
 * without touching any other keys, and writes it back - so re-running
 * `kratai init` never clobbers a user's other MCP servers or config.
 */
export function mergeJsonFile(filePath: string, key: string, subKey: string, value: unknown): void {
	let data: Record<string, unknown> = {};

	if (fs.existsSync(filePath)) {
		try {
			data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
		} catch {
			data = {};
		}
	}

	const section = data[key];
	data[key] = (typeof section === 'object' && section !== null) ? section : {};
	(data[key] as Record<string, unknown>)[subKey] = value;

	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}
