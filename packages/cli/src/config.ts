import * as fs from 'fs';
import * as path from 'path';
import { ConfigService, FolderConfig, KrataiConfig } from '@kratai/core';

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

/**
 * Applies per-folder patches (order, hiddenInStack, ...) to kratai.local.json
 * - the same personal, gitignored layer loadCliConfig already reads. Writes
 * the full *effective* folders map (base config + whatever local.json
 * already had, with these paths patched), not just the changed paths:
 * kratai.local.json's own `folders` key, if present, replaces the base
 * config's `folders` wholesale on load (a shallow `{ ...config,
 * ...localConfig }` merge, not a deep one) - writing only the delta here
 * would silently drop any folder settings that came from kratai.config.json
 * itself the next time this runs. A path patched for the first time
 * defaults to `selected: true` (included when parsing) - these UI-state
 * patches never mean to exclude a folder from parsing, only to say
 * something about how kratai view currently shows it.
 */
function patchLocalFolders(workspacePath: string, patches: Record<string, Partial<FolderConfig>>): void {
	const effectiveConfig = loadCliConfig(workspacePath, undefined, {});
	const localConfigPath = path.join(workspacePath, 'kratai.local.json');
	const existingLocal: Partial<KrataiConfig> = fs.existsSync(localConfigPath)
		? JSON.parse(fs.readFileSync(localConfigPath, 'utf-8'))
		: {};

	const folders: Record<string, FolderConfig> = { ...effectiveConfig.folders };
	for (const [folderPath, patch] of Object.entries(patches)) {
		const existingFolder = folders[folderPath];
		folders[folderPath] = { ...existingFolder, selected: existingFolder?.selected ?? true, ...patch };
	}

	const nextLocal: Partial<KrataiConfig> = { ...existingLocal, folders };
	fs.writeFileSync(localConfigPath, JSON.stringify(nextLocal, null, 2) + '\n', 'utf-8');
}

/** Persists custom folder order - the "hamburger" drag-reorder in `kratai view`'s stack layer. */
export function saveFolderOrder(workspacePath: string, orders: Record<string, number>): void {
	const patches: Record<string, Partial<FolderConfig>> = {};
	for (const [folderPath, order] of Object.entries(orders)) {
		patches[folderPath] = { order };
	}
	patchLocalFolders(workspacePath, patches);
}

/**
 * Persists a single folder's stack-layer visibility - the eye toggle in
 * `kratai view`'s stack layer. `folderPath` may be a real leaf/ancestor
 * folder path, or that path suffixed with the client's own "::self" marker
 * (see stackLayerView.ts's SELF_SUFFIX) for the narrower "hide just this
 * folder's own classes, not its subfolders" case - both are opaque string
 * keys as far as this function and the config file are concerned.
 */
export function saveFolderVisibility(workspacePath: string, folderPath: string, hidden: boolean): void {
	patchLocalFolders(workspacePath, { [folderPath]: { hiddenInStack: hidden } });
}
