import type { DiagramView, KrataiConfig } from '@kratai/core';

/**
 * The web app's saved diagram, scoped per repo+branch (there's no
 * workspace path to scope by, unlike the extension's ViewManager).
 * `config`/`id`/`name`/`createdAt`/`lastGenerated` mirror @kratai/core's
 * own `DiagramView` shape directly so the config object this app produces
 * is already what `CodeParserService.parseWorkspace` expects once the real
 * clone+parse infrastructure replaces the mock.
 */
export interface WebDiagramView extends DiagramView {
	repoFullName: string;
	branch: string;
}

export interface CreateViewInput {
	repoFullName: string;
	branch: string;
	name: string;
	config: KrataiConfig;
}
