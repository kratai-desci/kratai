import 'server-only';

import type { BillingInterval, Plan } from '@/2_domain';
import { planRepository } from '@/3_infrastructure/planRepository';
import { isStripeConfigured } from '@/3_infrastructure/stripe/stripeClient';
import { viewRepository } from '@/3_infrastructure/viewRepository';

import { getCurrentUser } from './queries';

/** REQUIREMENTS.md §9.1 - Free plan is capped at 1 saved diagram view. */
export const FREE_PLAN_VIEW_LIMIT = 1;

/** Whether real Stripe billing is configured - if not, the checkout/portal actions in billing.ts simulate the flow directly against planRepository instead of calling Stripe. REQUIREMENTS.md §9.3. */
export function isBillingConfigured(): boolean {
	return isStripeConfigured();
}

export function getViewLimit(plan: Plan): number {
	return plan === 'pro' ? Infinity : FREE_PLAN_VIEW_LIMIT;
}

export async function getCurrentPlan(): Promise<Plan> {
	const user = await getCurrentUser();
	const record = await planRepository.getBillingRecord(user.id);
	return record?.plan ?? 'free';
}

export interface PlanStatus {
	plan: Plan;
	viewCount: number;
	limit: number;
	atLimit: boolean;
	/** Only meaningful when plan === 'pro'. */
	billingInterval?: BillingInterval;
}

/**
 * Single call for anything that needs to know "can this user create another
 * diagram right now" - the /new page's limit gate, the profile page's plan
 * card, and the billing page all use this instead of composing the billing
 * record + view count themselves.
 */
export async function getPlanStatus(): Promise<PlanStatus> {
	const user = await getCurrentUser();
	const [record, views] = await Promise.all([
		planRepository.getBillingRecord(user.id),
		viewRepository.listViews(user.id),
	]);
	const plan = record?.plan ?? 'free';
	const limit = getViewLimit(plan);
	return {
		plan,
		viewCount: views.length,
		limit,
		atLimit: views.length >= limit,
		billingInterval: plan === 'pro' ? record?.billingInterval : undefined,
	};
}
