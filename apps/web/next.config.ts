import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// @kratai/core's barrel export (packages/core/src/index.ts) re-exports
	// telemetry/telemetryService.ts, which does `require.resolve('vscode')`
	// at module scope to detect a VS Code host. Webpack's static bundler
	// would fail to resolve that at build time (there's no such package in
	// node_modules) unless these packages are left external and required
	// at runtime by Node instead - same reason apps/mcp-server's esbuild.js
	// marks `external: ['vscode']`. This also keeps @kratai/core/@kratai/viewer
	// out of the client bundle entirely, since they're only ever imported
	// from Server Components / Route Handlers.
	serverExternalPackages: ['@kratai/core', '@kratai/viewer'],
};

export default nextConfig;
