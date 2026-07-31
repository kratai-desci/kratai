# Builds apps/web for Cloud Run. Lives at the repo root (not apps/web/) because
# this is an npm-workspaces monorepo - apps/web depends on the @kratai/core and
# @kratai/viewer workspace packages, so `npm ci` and the build both need the
# full workspace tree, not just apps/web in isolation.

FROM node:20-slim AS deps
WORKDIR /repo
# Copy every workspace's package.json (not just apps/web's) - npm ci validates
# the lockfile against the full workspace list declared in the root
# package.json, and fails if any member's package.json is missing.
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/viewer/package.json packages/viewer/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mcp-server/package.json apps/mcp-server/package.json
COPY apps/vsextension/package.json apps/vsextension/package.json
COPY apps/desktop/package.json apps/desktop/package.json
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
# @kratai/viewer imports @kratai/core, so core has to build first.
RUN npm run build --workspace=@kratai/core
RUN npm run build --workspace=@kratai/viewer
RUN npm run build --workspace=@kratai/web

FROM node:20-slim AS runner
WORKDIR /repo
ENV NODE_ENV=production

# GitCloneDiagramSource (3_infrastructure/clone/GitCloneDiagramSource.ts)
# shells out to the real `git` binary via execFile('git', ...) to clone
# repos for diagram generation - node:20-slim doesn't include it by default
# (that's the whole point of the "slim" variant). Missing this produces
# `Error: Failed to clone <repo>: spawn git ENOENT` at runtime, on the
# specific request that tries to generate a diagram - every other route
# works fine without it, which is why this wasn't caught by earlier route
# smoke-testing (none of those routes exercise cloning). ca-certificates is
# also missing from the slim base - without it, git can't verify GitHub's
# TLS certificate over HTTPS (confirmed via testing: git installed alone
# still failed with "server certificate verification failed. CAfile: none").
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# apps/web's own traced dependencies (next, react, mongodb, stripe, etc.) -
# output: 'standalone' in next.config.ts produces this; the standalone
# tracer walks the actual import graph so this node_modules is far smaller
# than the full monorepo's.
COPY --from=builder /repo/apps/web/.next/standalone ./
# Static assets and public/ are deliberately excluded from the standalone
# trace (Next's own documented behavior) and have to be copied separately.
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public

# @kratai/core and @kratai/viewer are marked serverExternalPackages in
# next.config.ts (see the comment there - @kratai/core does a
# require.resolve('vscode') at module scope that a bundler can't statically
# handle), which means the standalone tracer treats them as "the runtime
# already has this" and does NOT copy them in - unlike a real npm workspace
# checkout, where node_modules/@kratai/* are symlinks to packages/*. This
# replicates that resolution by hand: only the compiled out/ + package.json
# are needed at runtime, not the TypeScript source.
COPY --from=builder /repo/packages/core/out ./node_modules/@kratai/core/out
COPY --from=builder /repo/packages/core/package.json ./node_modules/@kratai/core/package.json
COPY --from=builder /repo/packages/viewer/out ./node_modules/@kratai/viewer/out
COPY --from=builder /repo/packages/viewer/package.json ./node_modules/@kratai/viewer/package.json
# @kratai/core's one real runtime dependency (parses PHP source files) -
# not traced into standalone's node_modules for the same
# serverExternalPackages reason as @kratai/core itself. @vscode/extension-telemetry
# is deliberately NOT copied - it's only ever dynamically imported after a
# require.resolve('vscode') check that always fails outside a real VS Code
# host, so that import is unreachable code here.
COPY --from=builder /repo/node_modules/php-parser ./node_modules/php-parser

# Cloud Run injects PORT at runtime and expects the container to listen on
# it - Next's standalone server.js already respects process.env.PORT, this
# default just matches Cloud Run's own default so local `docker run`
# without -e PORT=... still works the same way.
ENV PORT=8080
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
