import type { DiagramData, KrataiConfig } from '@kratai/core';

export interface DiagramSourceResult {
	diagramData: DiagramData;
	/** Commit actually cloned/parsed - what a saved view's commitSha is set to, so staleness can later be judged against it. */
	commitSha: string;
}

/**
 * Contract for getting the parsed architecture data for a repo/branch.
 * Shaped for the real implementation (server-side clone + parse, which
 * needs repoFullName/branch/config to know what to fetch and how to
 * filter it), even though today's mock implementation ignores those
 * arguments and always returns the same fixture.
 */
export interface DiagramSourceRepository {
	getDiagramData(repoFullName: string, branch: string, config: KrataiConfig): Promise<DiagramSourceResult>;
}
