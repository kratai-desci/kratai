'use server';

import type { Branch } from '@/2_domain';

import { listBranches } from './queries';

/**
 * Split out from queries.ts for the same reason authActions.ts is split
 * from auth.ts: NewDiagramFlow.tsx (a Client Component) needs to call this
 * directly, which requires a file-level 'use server' directive and
 * async-only exports - queries.ts has other, non-action exports that don't
 * fit that constraint.
 *
 * Fetches branches lazily, only for the one repo the user actually
 * selects - not eagerly for every repo up front (see app/(app)/(padded)/new/page.tsx).
 */
export async function listBranchesAction(
	repoFullName: string,
	defaultBranch: string
): Promise<Branch[]> {
	return listBranches(repoFullName, defaultBranch);
}
