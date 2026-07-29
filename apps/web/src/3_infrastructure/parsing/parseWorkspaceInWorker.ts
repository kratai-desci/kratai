import 'server-only';

import path from 'node:path';
import { Worker } from 'node:worker_threads';

import type { DiagramData, KrataiConfig } from '@kratai/core';

/**
 * Runs CodeParserService.parseWorkspace on its own OS thread instead of the
 * request-handling thread. parseWorkspace is synchronous and CPU-bound
 * (packages/core/src/parsing/codeParserService.ts) - for a large repo it can
 * occupy the main event loop for 30+ seconds, which would otherwise freeze
 * every other concurrent request on this server instance, not just the one
 * generating this diagram. One worker per call, not a shared long-lived
 * worker - a shared worker would just relocate the bottleneck instead of
 * adding throughput. See apps/web/REQUIREMENTS.md §5.3.1 for the full
 * writeup, including the Cloud Run --cpu/--concurrency settings this
 * depends on to get genuine parallelism (not just responsiveness).
 */

// process.cwd()-relative because this app isn't built with
// `output: 'standalone'` (next.config.ts), so `src/` ships as-is alongside
// the compiled `.next/` output at runtime. If standalone output is adopted
// later this needs to become an explicit postbuild-copied path instead -
// see REQUIREMENTS.md §5.3.1.
const WORKER_PATH = path.join(process.cwd(), 'src/3_infrastructure/parsing/parseWorker.js');

interface WorkerResult {
	ok: boolean;
	data?: DiagramData;
	error?: string;
}

export function parseWorkspaceInWorker(
	workspacePath: string,
	config: KrataiConfig
): Promise<DiagramData> {
	return new Promise((resolve, reject) => {
		const worker = new Worker(WORKER_PATH, { workerData: { workspacePath, config } });

		worker.once('message', (result: WorkerResult) => {
			void worker.terminate();
			if (result.ok && result.data) {
				resolve(result.data);
			} else {
				reject(new Error(result.error ?? 'Parse worker failed with no error message'));
			}
		});
		worker.once('error', (error) => {
			void worker.terminate();
			reject(error);
		});
		worker.once('exit', (code) => {
			if (code !== 0) reject(new Error(`Parse worker exited with code ${code}`));
		});
	});
}
