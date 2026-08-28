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

// Same deal for the app icon (assets/icon.png, this package's own - not shared
// with cli) - index.ts resolves it via __dirname at runtime too.
const iconSrc = path.join(__dirname, 'assets', 'icon.png');
const iconDest = path.join(__dirname, 'out', 'main', 'assets', 'icon.png');
fs.mkdirSync(path.dirname(iconDest), { recursive: true });
fs.copyFileSync(iconSrc, iconDest);
console.log('[copy-vendor] copied icon.png');

// Onboarding screenshots (assets/onboarding/{light,dark}/*.png) - onboarding.ts
// reads these at runtime and inlines them as data URIs into the injected
// overlay, picking whichever theme subfolder matches the page's own theme.
function copyDirRecursive(srcDir, destDir) {
	fs.mkdirSync(destDir, { recursive: true });
	for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
		const srcPath = path.join(srcDir, entry.name);
		const destPath = path.join(destDir, entry.name);
		if (entry.isDirectory()) {
			copyDirRecursive(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}
copyDirRecursive(path.join(__dirname, 'assets', 'onboarding'), path.join(__dirname, 'out', 'main', 'assets', 'onboarding'));
console.log('[copy-vendor] copied onboarding screenshots');
