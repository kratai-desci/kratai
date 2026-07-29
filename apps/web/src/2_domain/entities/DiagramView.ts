import type { DiagramView, KrataiConfig } from '@kratai/core';

/**
 * The web app's saved diagram, owned by the signed-in user who created it
 * (User aggregates DiagramViews) and scoped per repo+branch within that.
 * `config`/`id`/`name`/`createdAt`/`lastGenerated` mirror @kratai/core's
 * own `DiagramView` shape directly so the config object this app produces
 * is already what `CodeParserService.parseWorkspace` expects once the real
 * clone+parse infrastructure replaces the mock.
 */
export interface WebDiagramView extends DiagramView {
	userId: string;
	repoFullName: string;
	branch: string;
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
