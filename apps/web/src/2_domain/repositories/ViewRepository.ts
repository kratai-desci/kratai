import type { CreateViewInput, WebDiagramView } from '../entities/DiagramView';

/**
 * Contract for persisting saved diagram views. 3_infrastructure provides
 * the implementations (mock today, MongoDB Atlas later) - 1_application
 * only ever depends on this interface, never on a concrete implementation.
 */
export interface ViewRepository {
	listViews(filter?: { repoFullName?: string; branch?: string }): Promise<WebDiagramView[]>;
	getView(id: string): Promise<WebDiagramView | undefined>;
	createView(input: CreateViewInput): Promise<WebDiagramView>;
	updateView(
		id: string,
		updates: Partial<Pick<WebDiagramView, 'name' | 'config'>>
	): Promise<WebDiagramView | undefined>;
	deleteView(id: string): Promise<void>;
}
