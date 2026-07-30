import type { Plan } from './Plan';

export type BillingInterval = 'month' | 'year';

// The `| (string & {})` tail keeps this assignable from Stripe's own
// Subscription.Status type, which is an open union (it includes an
// `OtherString` catch-all for forward-compatibility with statuses Stripe
// adds later) - a closed union here would make every webhook assignment a
// type error the moment Stripe's SDK types get regenerated.
export type SubscriptionStatus =
	| 'active'
	| 'trialing'
	| 'past_due'
	| 'canceled'
	| 'incomplete'
	| 'incomplete_expired'
	| 'unpaid'
	| 'paused'
	| (string & {});

/**
 * Persisted per-user billing state - the local, fast-to-read cache of what
 * Stripe (or the cookie-based mock repository, when Mongo isn't configured)
 * says about this user's subscription. Kept in sync via Stripe webhooks
 * (app/api/webhooks/stripe/route.ts), never queried from Stripe live on
 * every page load - see REQUIREMENTS.md §9.
 */
export interface UserBillingRecord {
	userId: string;
	plan: Plan;
	stripeCustomerId?: string;
	stripeSubscriptionId?: string;
	subscriptionStatus?: SubscriptionStatus;
	billingInterval?: BillingInterval;
	currentPeriodEnd?: string;
}
