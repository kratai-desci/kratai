import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// Produces a minimal .next/standalone build (traced dependencies only,
	// includes its own node server) instead of relying on `next start` +
	// the full node_modules tree - what the Dockerfile's runtime stage
	// actually ships, since Cloud Run bills/scales per container image and
	// a standalone output is dramatically smaller than the whole monorepo's
	// node_modules.
	output: 'standalone',

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

	// next/image only loads from allowlisted remote hosts - GitHub's avatar
	// CDN, used for the real signed-in user's profile picture (Avatar
	// component, src = session.user.image).
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'avatars.githubusercontent.com',
			},
		],
	},
};

export default nextConfig;
