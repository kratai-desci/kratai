'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import type { BillingInterval, User } from '@/2_domain';
import { planRepository } from '@/3_infrastructure/planRepository';
import { getStripeClient, getStripePriceId, isStripeConfigured } from '@/3_infrastructure/stripe/stripeClient';

import { getCurrentUser } from './queries';

// 'use server' at file level makes every EXPORT here a Server Action, which
// requires each one to be an async function - isBillingConfigured() (sync)
// lives in plan.ts instead, and the webhook handler's own Stripe/repository
// access lives in stripeWebhook.ts (a plain server-only module, not this
// one) - neither belongs in a Server Action file.

async function getBaseUrl(): Promise<string> {
	const headerList = await headers();
	const host = headerList.get('host');
	const protocol = headerList.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
	return `${protocol}://${host}`;
}

async function ensureStripeCustomer(user: User): Promise<string> {
	const existing = await planRepository.getBillingRecord(user.id);
	if (existing?.stripeCustomerId) return existing.stripeCustomerId;

	const stripe = getStripeClient();
	const customer = await stripe.customers.create({
		email: user.email || undefined,
		name: user.name,
		metadata: { userId: user.id },
	});
	await planRepository.upsertBillingRecord(user.id, { stripeCustomerId: customer.id });
	return customer.id;
}

/**
 * Starts a Pro upgrade. Redirects to real Stripe Checkout when configured;
 * otherwise simulates the purchase directly (upserts the billing record,
 * same effect a successful checkout.session.completed webhook would have)
 * so the UI/UX can still be exercised without real billing wired up -
 * REQUIREMENTS.md §9.3.
 */
export async function createCheckoutSessionAction(interval: BillingInterval): Promise<void> {
	const user = await getCurrentUser();
	const existing = await planRepository.getBillingRecord(user.id);
	if (existing?.plan === 'pro') {
		redirect('/billing');
	}

	const baseUrl = await getBaseUrl();

	if (!isStripeConfigured()) {
		await planRepository.upsertBillingRecord(user.id, { plan: 'pro', billingInterval: interval });
		redirect(`/pricing/success?interval=${interval}`);
	}

	const stripe = getStripeClient();
	const customerId = await ensureStripeCustomer(user);
	const priceId = getStripePriceId(interval);

	const session = await stripe.checkout.sessions.create({
		customer: customerId,
		mode: 'subscription',
		line_items: [{ price: priceId, quantity: 1 }],
		client_reference_id: user.id,
		success_url: `${baseUrl}/pricing/success?interval=${interval}`,
		cancel_url: `${baseUrl}/pricing`,
	});

	if (!session.url) {
		throw new Error('Stripe did not return a checkout URL - please try again.');
	}
	redirect(session.url);
}

/** "Manage billing" - redirects to Stripe's own hosted Customer Portal (card, invoices, cancellation all live there once Stripe is configured). Falls back to the in-app mock billing page otherwise. */
export async function createPortalSessionAction(): Promise<void> {
	const user = await getCurrentUser();
	const billing = await planRepository.getBillingRecord(user.id);

	if (!isStripeConfigured() || !billing?.stripeCustomerId) {
		redirect('/billing');
	}

	const baseUrl = await getBaseUrl();
	const stripe = getStripeClient();
	const session = await stripe.billingPortal.sessions.create({
		customer: billing.stripeCustomerId,
		return_url: `${baseUrl}/billing`,
	});
	redirect(session.url);
}

/**
 * Mock-mode-only cancellation - only reachable from the billing page's mock
 * branch (Stripe not configured). Real cancellation goes through the Stripe
 * portal instead (createPortalSessionAction), never this.
 */
export async function cancelMockSubscriptionAction(): Promise<void> {
	const user = await getCurrentUser();
	await planRepository.upsertBillingRecord(user.id, {
		plan: 'free',
		stripeSubscriptionId: undefined,
		subscriptionStatus: undefined,
		billingInterval: undefined,
	});
	redirect('/pricing');
}
