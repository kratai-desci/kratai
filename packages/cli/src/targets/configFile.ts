import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@kratai/core';

const GITIGNORE_ENTRY = 'kratai.local.json';

/**
 * Scaffolds the shared config, never the personal one. kratai.config.json
 * is meant to be committed - a curated, team-visible view of the codebase -
 * so it's written once from smart defaults if missing and never touched
 * again by init (re-running init shouldn't clobber hand-tuning). The
 * personal kratai.local.json is never created here; it only appears once
 * someone actually saves a personal override (see config.ts), but the
 * .gitignore entry is seeded now so that file never gets committed by
 * accident the first time it does show up.
 */
export function setupConfigFile(workspacePath: string): void {
	const configPath = path.join(workspacePath, 'kratai.config.json');
	if (!fs.existsSync(configPath)) {
		const config = ConfigService.generateSmartDefaults(workspacePath);
		fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
		console.log('Wrote kratai.config.json (smart defaults - commit this, it\'s the shared view)');
	}

	const gitignorePath = path.join(workspacePath, '.gitignore');
	const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
	const alreadyIgnored = existing.split('\n').some(line => line.trim() === GITIGNORE_ENTRY);
	if (!alreadyIgnored) {
		const updated = existing.trim().length > 0 ? `${existing.trim()}\n${GITIGNORE_ENTRY}\n` : `${GITIGNORE_ENTRY}\n`;
		fs.writeFileSync(gitignorePath, updated, 'utf-8');
		console.log('Added kratai.local.json to .gitignore (personal overrides, never committed)');
	}
}
