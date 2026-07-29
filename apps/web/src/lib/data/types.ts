import type { DiagramView, KrataiConfig } from '@kratai/core';

/**
 * Data-access contract for this app. Every page/component goes through the
 * functions in `lib/data/index.ts` and `lib/data/actions.ts`, never the
 * mock implementations directly - that's the seam phase 2 (real GitHub API
 * + server-side clone + MongoDB Atlas) swaps behind, without touching UI.
 */

export interface Repo {
	id: string;
	owner: string;
	name: string;
	fullName: string;
	description: string;
	defaultBranch: string;
	private: boolean;
	updatedAt: string;
}

export interface Branch {
	name: string;
	isDefault: boolean;
}

/**
 * The web app's saved diagram, scoped per repo+branch (there's no
 * workspace path to scope by, unlike the extension's ViewManager).
 * `config`/`id`/`name`/`createdAt`/`lastGenerated` mirror @kratai/core's
 * own `DiagramView` shape directly so the config object this app produces
 * is already what `CodeParserService.parseWorkspace` expects in phase 2.
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
