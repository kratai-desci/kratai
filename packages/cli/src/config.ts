import * as fs from 'fs';
import * as path from 'path';
import { ConfigService, KrataiConfig } from '@kratai/core';

export interface ConfigOverrides {
	folders?: string[];
	gitDiff?: boolean;
}

/**
 * Independent of ConfigService.loadConfig/saveConfig, which stay pinned to
 * VS Code's `.vscode/kratai.json` convention. The CLI reads its own
 * `kratai.config.json` at the analyzed path instead - same merge-with-defaults
 * shape, just a different file, since the CLI has no live host to save back to.
 *
 * Layered on top: `kratai.local.json`, a personal, gitignored override (see
 * `init.ts`, which seeds the `.gitignore` entry but never creates the file
 * itself - it only appears once someone actually saves a personal tweak,
 * e.g. hiding a folder in `kratai view` without touching the shared config
 * everyone else sees). Precedence, lowest to highest: smart defaults →
 * kratai.config.json → kratai.local.json → CLI flags for this one run.
 */
export function loadCliConfig(
	workspacePath: string,
	configFlagPath: string | undefined,
	overrides: ConfigOverrides
): KrataiConfig {
	const resolvedConfigPath = configFlagPath
		? path.resolve(configFlagPath)
		: path.join(workspacePath, 'kratai.config.json');

	let config: KrataiConfig;

	if (fs.existsSync(resolvedConfigPath)) {
		const userConfig = JSON.parse(fs.readFileSync(resolvedConfigPath, 'utf-8')) as Partial<KrataiConfig>;
		config = { ...ConfigService.getDefaultConfig(), ...userConfig };
	} else {
		config = ConfigService.generateSmartDefaults(workspacePath);
	}

	// Personal override, never committed - only applied when the analyzed
	// path is the real workspace root (a --config flag pointing elsewhere
	// is an explicit, one-off choice that shouldn't get a local layer merged
	// on top of it).
	if (!configFlagPath) {
		const localConfigPath = path.join(workspacePath, 'kratai.local.json');
		if (fs.existsSync(localConfigPath)) {
			const localConfig = JSON.parse(fs.readFileSync(localConfigPath, 'utf-8')) as Partial<KrataiConfig>;
			config = { ...config, ...localConfig };
		}
	}

	if (overrides.folders && overrides.folders.length > 0) {
		config = { ...config, selectedFolders: overrides.folders, folders: undefined };
	}

	if (overrides.gitDiff === false) {
		config = { ...config, gitDiff: { ...config.gitDiff, enabled: false } };
	}

	return config;
}
