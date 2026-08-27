// Library entry point, separate from cli.mts (the esbuild-bundled `kratai`
// binary). Lets other in-repo packages - currently just @kratai/desktop -
// reuse the exact same view-server logic the CLI's `kratai view` command
// runs, instead of re-implementing or duplicating it. Built via
// tsconfig.lib.json into out/lib/, a different output directory than the
// bin bundle (out/cli.mjs), so neither build step touches the other's
// output.
export { runView } from './commands/view.js';
export type { ViewOptions } from './commands/view.js';
