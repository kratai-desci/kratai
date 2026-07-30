import 'server-only';

import { cookies } from 'next/headers';

import type { Plan, PlanRepository } from '@/2_domain';

export const MOCK_PLAN_COOKIE_NAME = 'mock-plan';

/**
 * Every user is on this mock repository today - there is no real billing
 * integration yet (REQUIREMENTS.md §9). Defaults to 'free'; the cookie
 * (flipped via 1_application/planActions.ts's setMockPlanAction, exposed as
 * a dev-only toggle on the profile page) lets the Free/Pro UI - the
 * pricing page, the plan badge, the 1-diagram limit - be previewed without
 * real billing data. Not user-specific by design: userId is unused, since
 * this is a local preview toggle, not a real per-account plan.
 */
export class MockPlanRepository implements PlanRepository {
	async getPlan(_userId: string): Promise<Plan> {
		const store = await cookies();
		return store.get(MOCK_PLAN_COOKIE_NAME)?.value === 'pro' ? 'pro' : 'free';
	}
}
