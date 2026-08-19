import type { KrataiConfig } from '@kratai/core';

import type { WebDiagramView } from '@/2_domain';

// Shared fixture data for the /mock UI-only tree. Underscore-prefixed file
// name keeps this out of the Next.js router. Single source of truth so
// dashboard, repo, and PR-detail pages all reference the same repos/PRs/
// views instead of drifting out of sync with each other.
export interface MockPr {
	number: number;
	title: string;
	flagged: boolean;
}

export interface MockRepo {
	repoFullName: string;
	branch: string;
	pulls: MockPr[];
}

export const MOCK_REPOS: MockRepo[] = [
	{
		repoFullName: 'kratai/kratai-content',
		branch: 'main',
		pulls: [
			{ number: 142, title: 'feat: add view duplication support', flagged: true },
			{ number: 138, title: 'fix: correct folder tree sort order', flagged: false },
			{ number: 135, title: 'chore: bump typescript to 5.6', flagged: false },
		],
	},
	{
		repoFullName: 'kratai/kratai-web',
		branch: 'main',
		pulls: [
			{ number: 58, title: 'feat: redesign pricing cards', flagged: false },
			{ number: 55, title: 'fix: mobile nav overlap', flagged: false },
		],
	},
];

export function getMockRepo(repoFullName: string): MockRepo | undefined {
	return MOCK_REPOS.find((r) => r.repoFullName === repoFullName);
}

export function getMockPr(repoFullName: string, number: number): MockPr | undefined {
	return getMockRepo(repoFullName)?.pulls.find((p) => p.number === number);
}

const MOCK_VIEW_CONFIG: KrataiConfig = { selectedFolders: [], selectedExtensions: [] };

export const MOCK_VIEWS: WebDiagramView[] = [
	{
		id: 'domain-model',
		name: 'Domain Model',
		config: MOCK_VIEW_CONFIG,
		createdAt: '2026-07-20T00:00:00.000Z',
		lastGenerated: '2026-08-01T00:00:00.000Z',
		userId: 'mock-user',
		repoFullName: 'kratai/kratai-content',
		branch: 'main',
		status: 'ready',
		commitSha: 'a1b2c3d',
	},
	{
		id: 'api-routes',
		name: 'API Routes',
		config: MOCK_VIEW_CONFIG,
		createdAt: '2026-07-22T00:00:00.000Z',
		lastGenerated: '2026-08-08T00:00:00.000Z',
		userId: 'mock-user',
		repoFullName: 'kratai/kratai-content',
		branch: 'main',
		status: 'ready',
		commitSha: 'e4f5a6b',
	},
	{
		id: 'auth-refactor',
		name: 'Auth Refactor',
		config: MOCK_VIEW_CONFIG,
		createdAt: '2026-08-05T00:00:00.000Z',
		lastGenerated: '2026-08-08T00:00:00.000Z',
		userId: 'mock-user',
		repoFullName: 'kratai/kratai-content',
		branch: 'feature/auth-refactor',
		status: 'ready',
		commitSha: 'c7d8e9f',
	},
	{
		id: 'kratai-web-architecture',
		name: 'Architecture',
		config: MOCK_VIEW_CONFIG,
		createdAt: '2026-07-15T00:00:00.000Z',
		lastGenerated: '2026-08-07T00:00:00.000Z',
		userId: 'mock-user',
		repoFullName: 'kratai/kratai-web',
		branch: 'main',
		status: 'ready',
		commitSha: '9a1f2e3',
	},
];

export function mockRepoHref(repoFullName: string): string {
	return `/mock/repo/${encodeURIComponent(repoFullName)}`;
}

export function mockPrHref(repoFullName: string, number: number): string {
	return `${mockRepoHref(repoFullName)}/pr/${number}`;
}

export function mockLatestPrHref(repoFullName: string): string {
	const latest = getMockRepo(repoFullName)?.pulls[0];
	return latest ? mockPrHref(repoFullName, latest.number) : mockRepoHref(repoFullName);
}

export function mockSettingsHref(repoFullName: string): string {
	return `${mockRepoHref(repoFullName)}/settings`;
}

export function mockSettingsPatternsHref(repoFullName: string): string {
	return `${mockSettingsHref(repoFullName)}/patterns`;
}
