// Copies the already-bundled, self-contained mcp-server build output into this
// extension's own out/ directory, so vsce packages it as a real file rather than
// relying on an npm workspace symlink that won't exist once installed elsewhere.
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'mcp-server', 'out');
const destDir = path.join(__dirname, 'out', 'mcp');

if (!fs.existsSync(path.join(srcDir, 'server.mjs'))) {
	console.error('[copy-mcp-server] apps/mcp-server/out/server.mjs not found - build @kratai/mcp-server first.');
	process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

for (const file of ['server.mjs', 'server.mjs.map']) {
	const src = path.join(srcDir, file);
	if (fs.existsSync(src)) {
		fs.copyFileSync(src, path.join(destDir, file));
		console.log(`[copy-mcp-server] copied ${file}`);
	}
}
