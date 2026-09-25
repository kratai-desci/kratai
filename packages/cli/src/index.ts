// Library entry point, separate from cli.mts (the esbuild-bundled `kratai`
// binary). Lets other in-repo packages - currently just @kratai/desktop -
// reuse the exact same view-server logic the CLI's `kratai view` command
// runs, instead of re-implementing or duplicating it. Built via
// tsconfig.lib.json into out/lib/, a different output directory than the
// bin bundle (out/cli.mjs), so neither build step touches the other's
// output.
export { runView } from './commands/view.js';
export type { ViewOptions, GenerationProgressStep } from './commands/view.js';
// Lets the desktop app decide whether to show its "generate now?" prompt
// (index.ts) before even calling runView - see these functions' own doc
// comments for why a cheap existence check is worth having separately from
// the full cached-data loaders runView itself uses.
export { hasCachedUseCaseDiagramData } from './useCaseDiagramData.js';
export { hasCachedDataModelData } from './dataModelData.js';
