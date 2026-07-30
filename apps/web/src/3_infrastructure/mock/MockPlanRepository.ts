import 'server-only';

import { cookies } from 'next/headers';

import type { PlanRepository, UserBillingRecord } from '@/2_domain';

export const MOCK_BILLING_COOKIE_NAME = 'mock-billing-record';

/**
 * Used whenever MongoDB isn't configured (3_infrastructure/planRepository.ts's
 * composition point, same gating as MockViewRepository) - stores the whole
 * billing record as one JSON cookie. There's no real multi-user isolation
 * without a database (the cookie is scoped to the browser, not an account),
 * which is fine for local dev without Mongo but not for anything real -
 * REQUIREMENTS.md §9. 1_application/billing.ts is what decides whether to
 * call the real Stripe API or short-circuit straight to an upsert here;
 * this class itself doesn't know or care whether Stripe is configured.
 */
export class MockPlanRepository implements PlanRepository {
	private async read(): Promise<UserBillingRecord | undefined> {
		const store = await cookies();
		const raw = store.get(MOCK_BILLING_COOKIE_NAME)?.value;
		if (!raw) return undefined;
		try {
			return JSON.parse(raw) as UserBillingRecord;
		} catch {
			return undefined;
		}
	}

	async getBillingRecord(userId: string): Promise<UserBillingRecord | undefined> {
		const record = await this.read();
		return record?.userId === userId ? record : undefined;
	}

	async upsertBillingRecord(
		userId: string,
		updates: Partial<Omit<UserBillingRecord, 'userId'>>
	): Promise<void> {
		const existing = await this.read();
		const merged: UserBillingRecord = {
			...(existing?.userId === userId ? existing : { userId, plan: 'free' }),
			...updates,
			userId,
		};
		const store = await cookies();
		store.set(MOCK_BILLING_COOKIE_NAME, JSON.stringify(merged), {
			httpOnly: true,
			sameSite: 'lax',
			path: '/',
		});
	}

	async findByStripeCustomerId(stripeCustomerId: string): Promise<UserBillingRecord | undefined> {
		const record = await this.read();
		return record?.stripeCustomerId === stripeCustomerId ? record : undefined;
	}
}
