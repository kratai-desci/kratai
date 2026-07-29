import type { Branch, Repo } from '../types';

// One real repo (kratai-desci/kratai) so "open file"/"open member" links in
// the demo diagram point at real, working GitHub URLs - the fixture data
// (src/lib/fixtures/sample-diagram.json) was actually parsed from this
// repo's packages/core + packages/viewer. The others are fake, just to make
// the repo picker feel like a real list; selecting them still renders the
// same demo diagram (see lib/diagram/generateDiagramHtml.ts) since there's
// no real clone/parse pipeline yet.
export const MOCK_REPOS: Repo[] = [
	{
		id: 'repo_kratai',
		owner: 'kratai-desci',
		name: 'kratai',
		fullName: 'kratai-desci/kratai',
		description: 'The architectural oversight layer for AI-native development.',
		defaultBranch: 'main',
		private: false,
		updatedAt: '2026-07-24T06:19:00Z',
	},
	{
		id: 'repo_storefront',
		owner: 'acme-corp',
		name: 'storefront',
		fullName: 'acme-corp/storefront',
		description: 'Next.js storefront frontend.',
		defaultBranch: 'main',
		private: true,
		updatedAt: '2026-07-20T14:02:00Z',
	},
	{
		id: 'repo_blog',
		owner: 'jane-doe',
		name: 'personal-blog',
		fullName: 'jane-doe/personal-blog',
		description: 'A small Django blog.',
		defaultBranch: 'master',
		private: false,
		updatedAt: '2026-06-30T09:45:00Z',
	},
];

export const MOCK_BRANCHES: Record<string, Branch[]> = {
	'kratai-desci/kratai': [
		{ name: 'main', isDefault: true },
		{ name: 'refactor', isDefault: false },
	],
	'acme-corp/storefront': [
		{ name: 'main', isDefault: true },
		{ name: 'develop', isDefault: false },
		{ name: 'feature/checkout-redesign', isDefault: false },
	],
	'jane-doe/personal-blog': [{ name: 'master', isDefault: true }],
};
