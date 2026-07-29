// One-off dev utility (not part of the app runtime): runs the real
// CodeParserService against packages/viewer and writes the resulting
// DiagramData as a static fixture the UI-phase app reads at runtime.
// Re-run manually (`npm run fixture:generate` in apps/web) if
// packages/viewer's source changes and the fixture should be refreshed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CodeParserService, type DiagramData, type KrataiConfig } from '@kratai/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..', '..');

// A moderate, real slice of this monorepo: the diagram-generation pipeline
// (packages/core's diagram/export/view/types layers) plus the renderer
// that consumes it (packages/viewer). Big enough for a genuine-looking
// demo diagram, small enough to stay readable - unlike e.g. packages/core's
// parsing/ + enrichment/ folders, which alone produce 500+ classes.
const config: KrataiConfig = {
	selectedFolders: [
		'packages/core/src/diagram',
		'packages/core/src/export',
		'packages/core/src/view',
		'packages/core/src/types',
		'packages/viewer/src',
	],
	selectedExtensions: ['.ts'],
	respectGitignore: true,
	detectHttpCalls: false,
	frameworkEnrichment: false,
};

async function main() {
	const data: DiagramData = await CodeParserService.parseWorkspace(repoRoot, config);

	const outPath = path.join(__dirname, '..', 'src', '3_infrastructure', 'fixtures', 'sample-diagram.json');
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');

	console.log(
		`Wrote ${data.classes.length} classes, ${data.relationships.length} relationships to ${path.relative(repoRoot, outPath)}`
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
