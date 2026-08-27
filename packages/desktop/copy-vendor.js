// Copies the same vendored three.js asset @kratai/cli uses (stackLayerView.ts,
// shared by both) into this package's own out/main/ - it's resolved via
// __dirname relative to wherever the running bundle actually lives, so each
// bundle location (cli's out/, desktop's out/main/) needs its own copy next
// to it.
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcFile = path.join(__dirname, '..', 'cli', 'vendor', 'three.module.min.js');
const destFile = path.join(__dirname, 'out', 'main', 'vendor', 'three.module.min.js');

if (!fs.existsSync(srcFile)) {
	console.error('[copy-vendor] ../cli/vendor/three.module.min.js not found.');
	process.exit(1);
}

fs.mkdirSync(path.dirname(destFile), { recursive: true });
fs.copyFileSync(srcFile, destFile);
console.log('[copy-vendor] copied three.module.min.js');
