import * as fs from 'fs';
import * as path from 'path';
import { CodeIndex } from '@kratai/core';
import { loadCliConfig } from '../config.js';
import { parseWorkspaceQuietly } from '../quietParse.js';

export interface StructureOptions {
	path: string;
	configPath?: string;
}

/**
 * Prints the cheap, names-only outline (folder tree + per-file class/
 * property/method names, no types, no signatures, no relationships) - the
 * starting point for an agent before it reaches for `search`/`detail` on
 * anything specific. Always a fresh full parse, ignoring any `hidden`
 * folder curation from kratai.local.json - that curation is about what's
 * worth showing unprompted; this is already the lean version.
 */
export async function runStructure(options: StructureOptions): Promise<void> {
	const workspacePath = path.resolve(options.path);

	if (!fs.existsSync(workspacePath)) {
		throw new Error(`Path not found: ${workspacePath}`);
	}

	const config = loadCliConfig(workspacePath, options.configPath, {});
	const diagramData = await parseWorkspaceQuietly(workspacePath, config);

	if (diagramData.classes.length === 0) {
		throw new Error('No classes found - check your folder/extension filters.');
	}

	console.log(CodeIndex.buildOutline(diagramData));
}
