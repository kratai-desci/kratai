import { CodeParserService, DiagramData, KrataiConfig } from '@kratai/core';

/**
 * Language parsers log their own progress via console.log (e.g.
 * PythonParser's "✅ Python parser: N classes..." per file) - harmless
 * noise for `analyze`/`view`, whose actual output goes to a file or an
 * HTTP response, never to stdout. structure/search/detail print their
 * result directly to stdout, so that same noise would land in the exact
 * stream an agent is trying to capture as the answer. Real warnings still
 * go through console.warn (stderr in Node), so muting only console.log
 * here silences the debug chatter without hiding anything that matters.
 */
export async function parseWorkspaceQuietly(workspacePath: string, config: KrataiConfig): Promise<DiagramData> {
	const originalLog = console.log;
	console.log = () => {};
	try {
		return await CodeParserService.parseWorkspace(workspacePath, config);
	} finally {
		console.log = originalLog;
	}
}
