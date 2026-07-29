import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import typescriptEslint from 'typescript-eslint';

// Native flat configs only - deliberately not using eslint-config-next's
// FlatCompat("next/core-web-vitals", ...) shim. That path round-trips
// through @eslint/eslintrc's legacy-config validator, which currently
// chokes on a circular reference inside eslint-plugin-react's own flat
// "recommended" config (its config.plugins.react points back at the
// plugin object) and fails with "Converting circular structure to JSON"
// before any real linting happens. @next/eslint-plugin-next and
// eslint-plugin-react-hooks both ship real flat configs directly, so we
// compose those instead and skip the compat layer entirely.
export default [
	...typescriptEslint.configs.recommended,
	{
		files: ['**/*.{ts,tsx}'],
		plugins: {
			'@next/next': nextPlugin,
			'react-hooks': reactHooks,
		},
		rules: {
			...nextPlugin.configs['core-web-vitals'].rules,
			...reactHooks.configs['recommended-latest'].rules,
			// Leading underscore marks an intentionally-unused parameter (e.g.
			// mock repository implementations matching a domain interface
			// shaped for arguments the mock doesn't need).
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		},
	},
	{
		// Plain CommonJS script loaded directly by node:worker_threads, not
		// compiled/bundled by Next.js or written against the app's TS/ESM
		// conventions - see parseWorkspaceInWorker.ts for why.
		ignores: [
			'.next/**',
			'scripts/**',
			'src/3_infrastructure/fixtures/**',
			'src/3_infrastructure/parsing/parseWorker.js',
		],
	},
];
