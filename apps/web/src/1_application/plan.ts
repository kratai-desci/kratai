import 'server-only';

import { cookies } from 'next/headers';

import type { Plan } from '@/2_domain';
import { planRepository } from '@/3_infrastructure/planRepository';
import { viewRepository } from '@/3_infrastructure/viewRepository';

import { getCurrentUser } from './queries';

/** REQUIREMENTS.md §9.1 - Free plan is capped at 1 saved diagram view. */
export const FREE_PLAN_VIEW_LIMIT = 1;

export type BillingInterval = 'month' | 'year';

// Demo-only: which billing cycle the mocked "purchase" used. Not part of
// PlanRepository - a real integration gets this from the payment
// processor's subscription object, not a cookie. Exists purely so the
// mocked Manage Billing page (/billing) can show a plausible price instead
// of just "Pro" with no detail. Shared with planActions.ts's
// setMockPlanAction, which is the only writer.
export const MOCK_BILLING_INTERVAL_COOKIE = 'mock-billing-interval';

export async function getMockBillingInterval(): Promise<BillingInterval> {
	const store = await cookies();
	return store.get(MOCK_BILLING_INTERVAL_COOKIE)?.value === 'year' ? 'year' : 'month';
}

export function getViewLimit(plan: Plan): number {
	return plan === 'pro' ? Infinity : FREE_PLAN_VIEW_LIMIT;
}

export async function getCurrentPlan(): Promise<Plan> {
	const user = await getCurrentUser();
	return planRepository.getPlan(user.id);
}

export interface PlanStatus {
	plan: Plan;
	viewCount: number;
	limit: number;
	atLimit: boolean;
	/** Only meaningful when plan === 'pro' - see getMockBillingInterval. */
	billingInterval?: BillingInterval;
}

/**
 * Single call for anything that needs to know "can this user create another
 * diagram right now" - the /new page's limit gate and the profile page's
 * plan card both use this instead of composing plan + view count
 * themselves.
 */
export async function getPlanStatus(): Promise<PlanStatus> {
	const user = await getCurrentUser();
	const [plan, views, billingInterval] = await Promise.all([
		planRepository.getPlan(user.id),
		viewRepository.listViews(user.id),
		getMockBillingInterval(),
	]);
	const limit = getViewLimit(plan);
	return {
		plan,
		viewCount: views.length,
		limit,
		atLimit: views.length >= limit,
		billingInterval: plan === 'pro' ? billingInterval : undefined,
	};
}
