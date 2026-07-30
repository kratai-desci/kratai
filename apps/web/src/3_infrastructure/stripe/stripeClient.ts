import 'server-only';

import Stripe from 'stripe';

export function isStripeConfigured(): boolean {
	return Boolean(process.env.STRIPE_SECRET_KEY);
}

let stripeClient: Stripe | undefined;

/** Throws if STRIPE_SECRET_KEY isn't set - callers must check isStripeConfigured() first (1_application/billing.ts does). */
export function getStripeClient(): Stripe {
	if (!process.env.STRIPE_SECRET_KEY) {
		throw new Error('STRIPE_SECRET_KEY is not set');
	}
	if (!stripeClient) {
		stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
	}
	return stripeClient;
}

export function getStripePriceId(interval: 'month' | 'year'): string {
	const envVar = interval === 'year' ? 'STRIPE_PRICE_ID_ANNUAL' : 'STRIPE_PRICE_ID_MONTHLY';
	const priceId = process.env[envVar];
	if (!priceId) {
		throw new Error(`${envVar} is not set`);
	}
	return priceId;
}

export function getStripeWebhookSecret(): string {
	const secret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!secret) {
		throw new Error('STRIPE_WEBHOOK_SECRET is not set');
	}
	return secret;
}
