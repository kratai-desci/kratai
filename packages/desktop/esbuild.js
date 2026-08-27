import * as esbuild from 'esbuild';

// ESM, not CJS like the old desktop app's build - @kratai/cli (which this
// imports runView from) is itself an ESM package, and a CJS file can't
// `require()` an ESM one synchronously. Electron 28+ (we're on 33) supports
// an ESM main process directly, so this is the simpler fix over juggling
// dynamic import().
await esbuild.build({
	entryPoints: ['src/main/index.ts'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node18',
	outfile: 'out/main/index.js',
	sourcemap: true,
	logLevel: 'info',
	// Provided by the Electron runtime - never bundle it.
	external: ['electron'],
	// @kratai/analysis (pulled in transitively via @kratai/cli's runView) is
	// compiled as CommonJS, and one of its own deps (`typescript`, used by
	// TypeScriptParser) is too - both rely on require()/__filename/__dirname,
	// none of which exist in esbuild's ESM output. Reviving all three via
	// Node's own APIs is esbuild's documented fix for bundling CJS deps into
	// an ESM bundle.
	banner: {
		// Aliased imports - the bundle also has its own real `import {
		// fileURLToPath } from 'url'` somewhere inside it (from one of the
		// bundled files), and since banner text is injected as raw source
		// rather than going through esbuild's own import deduplication, an
		// unaliased import here collides with that real one instead of
		// merging with it.
		js: [
			"import { createRequire } from 'module';",
			"import { fileURLToPath as __kratai_fileURLToPath } from 'url';",
			"import { dirname as __kratai_dirname } from 'path';",
			'const require = createRequire(import.meta.url);',
			'const __filename = __kratai_fileURLToPath(import.meta.url);',
			'const __dirname = __kratai_dirname(__filename);'
		].join('\n')
	}
});
