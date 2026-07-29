// Plain CommonJS script, deliberately not TypeScript - it's loaded directly
// by node:worker_threads (new Worker(path)), not compiled or bundled by
// Next.js, so it must be something Node can `require` as-is. See
// parseWorkspaceInWorker.ts for why this runs off the main thread at all.
const { parentPort, workerData } = require('node:worker_threads');
const { CodeParserService } = require('@kratai/core');

CodeParserService.parseWorkspace(workerData.workspacePath, workerData.config)
	.then((data) => parentPort.postMessage({ ok: true, data }))
	.catch((error) => {
		parentPort.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
	});
