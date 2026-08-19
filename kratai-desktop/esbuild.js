const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
	// Main process: full Node access, talks to @kratai/core against the real filesystem.
	await esbuild.build({
		entryPoints: ['src/main/index.ts'],
		bundle: true,
		platform: 'node',
		format: 'cjs',
		target: 'node18',
		outfile: 'out/main/index.js',
		sourcemap: true,
		logLevel: 'info',
		// Provided by the Electron runtime - never bundle it.
		external: ['electron']
	});

	// Preload script: runs in a Node-enabled context bridged into the renderer.
	await esbuild.build({
		entryPoints: ['src/preload/index.ts'],
		bundle: true,
		platform: 'node',
		format: 'cjs',
		target: 'node18',
		outfile: 'out/preload/index.js',
		sourcemap: true,
		logLevel: 'info',
		external: ['electron']
	});

	// Renderer: plain browser context, no Node/Electron APIs - only what the
	// preload script exposes via contextBridge (window.kratai).
	await esbuild.build({
		entryPoints: ['src/renderer/renderer.ts'],
		bundle: true,
		platform: 'browser',
		format: 'iife',
		target: 'chrome120',
		outfile: 'out/renderer/renderer.js',
		sourcemap: true,
		logLevel: 'info'
	});

	// esbuild only bundles JS/TS - the renderer's static HTML/CSS just need copying
	// alongside the bundled script so BrowserWindow.loadFile finds them together.
	fs.mkdirSync('out/renderer', { recursive: true });
	for (const file of ['index.html', 'styles.css']) {
		fs.copyFileSync(path.join('src/renderer', file), path.join('out/renderer', file));
	}
}

build().catch(() => process.exit(1));
