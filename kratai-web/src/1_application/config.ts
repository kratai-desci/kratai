import type { KrataiConfig } from '@kratai/core';

export const DEFAULT_CONFIG: KrataiConfig = {
	selectedFolders: [],
	selectedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.php', '.html'],
	respectGitignore: true,
	classTypeFilters: {},
	relationshipTypeFilters: {},
	detectHttpCalls: true,
	frameworkEnrichment: true,
};
