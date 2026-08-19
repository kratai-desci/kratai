import type { DiagramData, DiagramView, KrataiConfig } from '@kratai/core';

/**
 * - idle: never generated yet (just created, or config just changed) -
 *   the next page load is expected to generate it inline.
 * - generating: a clone+parse is in flight for this view right now -
 *   enforced by ViewRepository.beginGeneration's atomic status transition
 *   so at most one generation runs per view at a time, even across
 *   multiple server instances.
 * - ready: diagramData is populated and safe to render. May still be
 *   stale (see commitSha) - staleness is computed on read, not stored.
 * - failed: generation errored and there is no diagramData to fall back
 *   to (a failed *re*generation of an already-ready view instead reverts
 *   status back to 'ready', keeping the last good data - see
 *   ViewRepository.failGeneration).
 */
export type ViewGenerationStatus = 'idle' | 'generating' | 'ready' | 'failed';

/**
 * The web app's saved diagram, owned by the signed-in user who created it
 * (User aggregates DiagramViews) and scoped per repo+branch within that.
 * `config`/`id`/`name`/`createdAt`/`lastGenerated` mirror @kratai/core's
 * own `DiagramView` shape directly so the config object this app produces
 * is already what `CodeParserService.parseWorkspace` expects once the real
 * clone+parse infrastructure replaces the mock.
 *
 * diagramData is the cached parse result (classes + relationships) for
 * status 'ready' - deliberately not the generated HTML, since regenerating
 * HTML/folder-tree/filter-options from diagramData is cheap and pure, so
 * caching one level below that keeps re-filtering free too. It's a
 * comparatively large field: ViewRepository.listViews must project it out
 * so listing a user's views doesn't transfer every view's full payload.
 */
export interface WebDiagramView extends DiagramView {
	userId: string;
	repoFullName: string;
	branch: string;
	status: ViewGenerationStatus;
	/** Commit the cached diagramData was generated from. Absent until the first successful generation. */
	commitSha?: string;
	/** ISO timestamp set when status flips to 'generating' - lets a crashed/stuck generation self-heal after a timeout instead of wedging the view forever. */
	generatingSince?: string;
	/** Message from the most recent failed generation attempt, if any. */
	lastError?: string;
	diagramData?: DiagramData;
}

/**
 * Deliberately has no userId - the owner is always derived server-side
 * from the signed-in session (1_application), never accepted from the
 * client. See ViewRepository.createView.
 */
export interface CreateViewInput {
	repoFullName: string;
	branch: string;
	name: string;
	config: KrataiConfig;
}
