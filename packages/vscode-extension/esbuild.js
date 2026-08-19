const esbuild = require('esbuild');

esbuild
	.build({
		entryPoints: ['src/extension.ts'],
		bundle: true,
		platform: 'node',
		format: 'cjs',
		target: 'node18',
		outfile: 'out/extension.js',
		sourcemap: true,
		logLevel: 'info',
		external: [
			// Provided by the VS Code extension host at runtime - never bundle it.
			'vscode',
			// Only reached as a dev-mode fallback (see extension.ts) when the bundled
			// mcp-server copy doesn't exist yet - never actually resolved in a packaged
			// extension, so it doesn't need to be bundled either.
			'@kratai/mcp-server/out/server.mjs'
		]
	})
	.catch(() => process.exit(1));
