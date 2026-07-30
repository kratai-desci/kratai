import 'server-only';

import type { Plan } from '@/2_domain';
import { planRepository } from '@/3_infrastructure/planRepository';
import { viewRepository } from '@/3_infrastructure/viewRepository';

import { getCurrentUser } from './queries';

/** REQUIREMENTS.md §9.1 - Free plan is capped at 1 saved diagram view. */
export const FREE_PLAN_VIEW_LIMIT = 1;

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
}

/**
 * Single call for anything that needs to know "can this user create another
 * diagram right now" - the /new page's limit gate and the profile page's
 * plan card both use this instead of composing plan + view count
 * themselves.
 */
export async function getPlanStatus(): Promise<PlanStatus> {
	const user = await getCurrentUser();
	const [plan, views] = await Promise.all([
		planRepository.getPlan(user.id),
		viewRepository.listViews(user.id),
	]);
	const limit = getViewLimit(plan);
	return { plan, viewCount: views.length, limit, atLimit: views.length >= limit };
}
