import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['src/cli.mts'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node18',
	outfile: 'out/cli.mjs',
	sourcemap: true,
	logLevel: 'info',
	// telemetryService.ts dynamically imports @vscode/extension-telemetry only when
	// running inside a VS Code host (isVSCodeContext check) - that package's own code
	// does a static require('vscode') internally, which esbuild can't resolve since
	// 'vscode' isn't a real npm package. Mark it external: the require stays unresolved
	// in the bundle but is simply never reached at runtime outside VS Code.
	external: ['vscode'],
	// @kratai/analysis's compiled output (and the TypeScript compiler it bundles in, for
	// TypeScriptParser) is CommonJS; bundling CJS into an ESM output means require(),
	// __filename, and __dirname all need real ESM-native equivalents, since none of
	// those exist natively in ESM.
	banner: {
		js: [
			"import { createRequire } from 'module';",
			"import { fileURLToPath as _fileURLToPath } from 'url';",
			"import { dirname as _dirname } from 'path';",
			'const require = createRequire(import.meta.url);',
			'const __filename = _fileURLToPath(import.meta.url);',
			'const __dirname = _dirname(__filename);'
		].join('\n')
	}
});
