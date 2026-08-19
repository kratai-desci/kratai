// Copies the shared SKILL.md (source of truth: packages/skill) into this
// package's own out/ folder, since it isn't published as its own npm package.
// `kratai init` reads it from here at runtime (see src/commands/init.ts).
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcFile = path.join(__dirname, '..', 'skill', 'SKILL.md');
const destFile = path.join(__dirname, 'out', 'SKILL.md');

if (!fs.existsSync(srcFile)) {
	console.error('[copy-skill] packages/skill/SKILL.md not found.');
	process.exit(1);
}

fs.mkdirSync(path.dirname(destFile), { recursive: true });
fs.copyFileSync(srcFile, destFile);
console.log('[copy-skill] copied SKILL.md');
