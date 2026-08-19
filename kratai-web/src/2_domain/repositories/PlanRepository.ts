import type { UserBillingRecord } from '../entities/UserBilling';

/**
 * Contract for persisted per-user billing state. 3_infrastructure provides
 * the implementation - MongoDB-backed once configured, a cookie-based mock
 * otherwise (see 3_infrastructure/planRepository.ts's composition point,
 * gated on Mongo like ViewRepository - not on Stripe, since storage and
 * payment-processing are separate concerns; 1_application/billing.ts is
 * what decides whether to call the real Stripe API or short-circuit to a
 * direct upsert when Stripe isn't configured). REQUIREMENTS.md §9.
 */
export interface PlanRepository {
	getBillingRecord(userId: string): Promise<UserBillingRecord | undefined>;
	/**
	 * Partial update, upserting if no record exists yet - callers (the
	 * checkout/cancel actions, the Stripe webhook handler) only ever pass
	 * the fields that changed, not the whole record.
	 */
	upsertBillingRecord(userId: string, updates: Partial<Omit<UserBillingRecord, 'userId'>>): Promise<void>;
	/**
	 * Used by the Stripe webhook handler, which only ever has the Stripe
	 * customer id in most event payloads, not our own userId.
	 */
	findByStripeCustomerId(stripeCustomerId: string): Promise<UserBillingRecord | undefined>;
}
