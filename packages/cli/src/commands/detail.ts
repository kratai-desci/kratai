import * as fs from 'fs';
import * as path from 'path';
import { CodeIndex } from '@kratai/core';
import { loadCliConfig } from '../config.js';
import { parseWorkspaceQuietly } from '../quietParse.js';

export interface DetailOptions {
	path: string;
	identifier: string;
	configPath?: string;
}

/**
 * Full detail (properties, methods, relationships) for one class or every
 * class in one file - see CodeIndex.getDetail for the exact resolution
 * order (qualified "file::name", exact file path, then bare class name,
 * with ambiguous names returning candidates instead of a guess). Always a
 * fresh full parse, ignoring `hidden` folder curation (see structure.ts).
 */
export async function runDetail(options: DetailOptions): Promise<void> {
	const workspacePath = path.resolve(options.path);

	if (!fs.existsSync(workspacePath)) {
		throw new Error(`Path not found: ${workspacePath}`);
	}

	if (!options.identifier) {
		throw new Error('detail requires a class name, file path, or "file::ClassName", e.g. `kratai detail UserCreate`');
	}

	const config = loadCliConfig(workspacePath, options.configPath, {});
	const diagramData = await parseWorkspaceQuietly(workspacePath, config);

	console.log(CodeIndex.getDetail(diagramData, options.identifier));
}
