import * as fs from 'fs';
import * as path from 'path';
import { CodeIndex } from '@kratai/core';
import { loadCliConfig } from '../config.js';
import { parseWorkspaceQuietly } from '../quietParse.js';

export interface SearchOptions {
	path: string;
	query: string;
	configPath?: string;
}

/**
 * Finds classes/files by name so an agent can locate something without
 * grepping raw source - a substring match, case-insensitive, over class
 * names and file paths. Always a fresh full parse, ignoring `hidden`
 * folder curation (see structure.ts for why).
 */
export async function runSearch(options: SearchOptions): Promise<void> {
	const workspacePath = path.resolve(options.path);

	if (!fs.existsSync(workspacePath)) {
		throw new Error(`Path not found: ${workspacePath}`);
	}

	if (!options.query) {
		throw new Error('search requires a query, e.g. `kratai search UserCreate`');
	}

	const config = loadCliConfig(workspacePath, options.configPath, {});
	const diagramData = await parseWorkspaceQuietly(workspacePath, config);

	console.log(CodeIndex.search(diagramData, options.query));
}
