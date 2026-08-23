// Copies vendored third-party assets (currently just three.js, used by the
// stack-layer view - see src/stackLayerView.ts) into this package's own
// out/ folder, read back at runtime the same way copy-skill.js's SKILL.md is.
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcFile = path.join(__dirname, 'vendor', 'three.module.min.js');
const destFile = path.join(__dirname, 'out', 'vendor', 'three.module.min.js');

if (!fs.existsSync(srcFile)) {
	console.error('[copy-vendor] vendor/three.module.min.js not found.');
	process.exit(1);
}

fs.mkdirSync(path.dirname(destFile), { recursive: true });
fs.copyFileSync(srcFile, destFile);
console.log('[copy-vendor] copied three.module.min.js');
