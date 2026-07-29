import type { Branch, Repo } from '../types';

// All fictional - none of these link to a real GitHub repo. The seeded
// diagram's fixture data (src/lib/fixtures/sample-diagram.json) was parsed
// from real local source, but "open file"/"open member" links are built
// from whatever repoFullName/branch the view has, so they don't resolve to
// anything for this mock repo (same as the other two below). Selecting any
// of these still renders the same demo diagram (see
// lib/diagram/generateDiagramHtml.ts) since there's no real clone/parse
// pipeline yet.
export const MOCK_REPOS: Repo[] = [
	{
		id: 'repo_sample',
		owner: 'sample-dev',
		name: 'architecture-tool',
		fullName: 'sample-dev/architecture-tool',
		description: 'Sample repo used for the seeded demo diagram.',
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
	'sample-dev/architecture-tool': [
		{ name: 'main', isDefault: true },
		{ name: 'develop', isDefault: false },
	],
	'acme-corp/storefront': [
		{ name: 'main', isDefault: true },
		{ name: 'develop', isDefault: false },
		{ name: 'feature/checkout-redesign', isDefault: false },
	],
	'jane-doe/personal-blog': [{ name: 'master', isDefault: true }],
};
