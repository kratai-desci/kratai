import type { DiagramData } from '@kratai/core';

import type { CreateViewInput, WebDiagramView } from '../entities/DiagramView';

/**
 * Contract for persisting saved diagram views. 3_infrastructure provides
 * the implementations (mock today, MongoDB Atlas later) - 1_application
 * only ever depends on this interface, never on a concrete implementation.
 *
 * Every method is scoped by userId (User aggregates DiagramViews) - not
 * just an optional filter on listViews, but a required parameter
 * everywhere, including getView/updateView/deleteView, so a user can never
 * read, modify, or delete a view that isn't theirs, even if they know or
 * guess its id. Implementations must enforce this in the query itself
 * (e.g. `{ _id, userId }`), not by fetching first and checking after.
 *
 * listViews must project diagramData out (WebDiagramView.diagramData is a
 * comparatively large field) - listing a user's views should never
 * transfer every view's full cached payload.
 *
 * beginGeneration/completeGeneration/failGeneration exist as explicit
 * atomic operations, not left to callers composing getView+updateView,
 * because the "only one generation per view at a time" guarantee has to be
 * enforced by the database itself (an in-process lock doesn't see other
 * server instances). Implementations must perform the status check and the
 * transition to 'generating' as a single atomic operation (e.g. Mongo
 * findOneAndUpdate with the check in the filter), not a separate
 * read-then-write.
 */
export interface ViewRepository {
	listViews(
		userId: string,
		filter?: { repoFullName?: string; branch?: string }
	): Promise<WebDiagramView[]>;
	getView(id: string, userId: string): Promise<WebDiagramView | undefined>;
	createView(userId: string, input: CreateViewInput): Promise<WebDiagramView>;
	updateView(
		id: string,
		userId: string,
		updates: Partial<Pick<WebDiagramView, 'name' | 'config'>>
	): Promise<WebDiagramView | undefined>;
	deleteView(id: string, userId: string): Promise<void>;

	/**
	 * Atomically transitions a view to 'generating', unless it's already
	 * generating (and not stuck - see WebDiagramView.generatingSince).
	 * Returns the updated view if the lock was acquired, undefined if
	 * another generation is already in flight (or the view doesn't exist /
	 * isn't owned by this user) - callers must not start a worker in that
	 * case.
	 */
	beginGeneration(id: string, userId: string): Promise<WebDiagramView | undefined>;
	/**
	 * Records a successful generation: stores diagramData/commitSha, sets
	 * status back to 'ready'.
	 */
	completeGeneration(
		id: string,
		userId: string,
		result: { diagramData: DiagramData; commitSha: string }
	): Promise<WebDiagramView | undefined>;
	/**
	 * Records a failed generation. If the view already had diagramData from
	 * a previous successful generation, status reverts to 'ready' (keeping
	 * the last good data) rather than 'failed' - a failed *re*generation
	 * shouldn't take away a working diagram, only a failed first-ever
	 * generation should. errorMessage is stored either way as lastError.
	 */
	failGeneration(id: string, userId: string, errorMessage: string): Promise<WebDiagramView | undefined>;
}
