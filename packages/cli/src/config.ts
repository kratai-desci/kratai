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

	if (overrides.folders && overrides.folders.length > 0) {
		config = { ...config, selectedFolders: overrides.folders, folders: undefined };
	}

	if (overrides.gitDiff === false) {
		config = { ...config, gitDiff: { ...config.gitDiff, enabled: false } };
	}

	return config;
}
