'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import type { Plan } from '@/2_domain';
import { MOCK_PLAN_COOKIE_NAME } from '@/3_infrastructure/mock/MockPlanRepository';

/**
 * Dev/demo-only: flips the mock plan repository's stored value so the
 * Free/Pro UI (pricing page, plan badge, 1-diagram limit) can be previewed
 * without real billing wired up. Not a real user-facing setting - this
 * action (and the profile-page toggle that calls it) goes away once a real
 * PlanRepository exists.
 */
export async function setMockPlanAction(plan: Plan): Promise<void> {
	const store = await cookies();
	store.set(MOCK_PLAN_COOKIE_NAME, plan, { httpOnly: true, sameSite: 'lax', path: '/' });
	revalidatePath('/');
}
