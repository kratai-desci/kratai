import type { DiagramData, KrataiConfig } from '@kratai/core';

/**
 * Contract for getting the parsed architecture data for a repo/branch.
 * Shaped for the real implementation (server-side clone + parse, which
 * needs repoFullName/branch/config to know what to fetch and how to
 * filter it), even though today's mock implementation ignores those
 * arguments and always returns the same fixture.
 */
export interface DiagramSourceRepository {
	getDiagramData(repoFullName: string, branch: string, config: KrataiConfig): Promise<DiagramData>;
}
