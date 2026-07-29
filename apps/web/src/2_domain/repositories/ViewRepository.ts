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
}
