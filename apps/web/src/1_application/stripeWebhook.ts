import 'server-only';

import type Stripe from 'stripe';

import { planRepository } from '@/3_infrastructure/planRepository';
import { getStripeClient, getStripeWebhookSecret } from '@/3_infrastructure/stripe/stripeClient';

const ACTIVE_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing']);

/** Verifies the raw request body actually came from Stripe before any of it is trusted. Throws on an invalid/missing signature. */
export async function verifyStripeWebhookEvent(payload: string, signature: string): Promise<Stripe.Event> {
	const stripe = getStripeClient();
	return stripe.webhooks.constructEventAsync(payload, signature, getStripeWebhookSecret());
}

/**
 * Stripe webhooks are the source of truth for subscription state - this is
 * what actually flips a user's plan, not the checkout redirect itself
 * (that's just UI; the async event is what's authoritative). Only
 * subscription lifecycle events matter here: checkout.session.completed
 * isn't handled separately because ensureStripeCustomer
 * (1_application/billing.ts) already links stripeCustomerId -> userId
 * before checkout even starts, so every subscription event's `customer`
 * field is enough to resolve back to our user via
 * findByStripeCustomerId - REQUIREMENTS.md §9.
 */
export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
	switch (event.type) {
		case 'customer.subscription.created':
		case 'customer.subscription.updated':
		case 'customer.subscription.deleted': {
			const subscription = event.data.object as Stripe.Subscription;
			const customerId =
				typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

			const record = await planRepository.findByStripeCustomerId(customerId);
			if (!record) break; // Customer not linked to a known user - nothing to update.

			const item = subscription.items.data[0];
			const isActive = event.type !== 'customer.subscription.deleted' && ACTIVE_STATUSES.has(subscription.status);

			await planRepository.upsertBillingRecord(record.userId, {
				plan: isActive ? 'pro' : 'free',
				stripeSubscriptionId: subscription.id,
				subscriptionStatus: subscription.status,
				billingInterval: item?.price.recurring?.interval === 'year' ? 'year' : 'month',
				currentPeriodEnd: item ? new Date(item.current_period_end * 1000).toISOString() : undefined,
			});
			break;
		}
		default:
			break;
	}
}
