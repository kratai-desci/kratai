'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import type { Plan } from '@/2_domain';
import { MOCK_PLAN_COOKIE_NAME } from '@/3_infrastructure/mock/MockPlanRepository';

import { MOCK_BILLING_INTERVAL_COOKIE, type BillingInterval } from './plan';

/**
 * Dev/demo-only: flips the mock plan repository's stored value so the
 * Free/Pro UI (pricing page, plan badge, 1-diagram limit, /billing) can be
 * previewed without real billing wired up. Not a real user-facing setting -
 * this action (and everything that calls it: the profile-page dev toggle,
 * the pricing page's "purchase" buttons, the billing page's cancel button)
 * goes away once a real PlanRepository exists. `interval` is only stored
 * when upgrading to Pro; downgrading to Free clears it.
 */
export async function setMockPlanAction(plan: Plan, interval?: BillingInterval): Promise<void> {
	const store = await cookies();
	store.set(MOCK_PLAN_COOKIE_NAME, plan, { httpOnly: true, sameSite: 'lax', path: '/' });
	if (plan === 'pro' && interval) {
		store.set(MOCK_BILLING_INTERVAL_COOKIE, interval, { httpOnly: true, sameSite: 'lax', path: '/' });
	} else {
		store.delete(MOCK_BILLING_INTERVAL_COOKIE);
	}
	revalidatePath('/');
}

/** Thin, clearly-named wrapper around setMockPlanAction for the billing page's Cancel button - reads better at the call site than setMockPlanAction('free'). */
export async function cancelMockSubscriptionAction(): Promise<void> {
	await setMockPlanAction('free');
}
