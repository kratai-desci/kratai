import type Stripe from 'stripe';
import { NextResponse } from 'next/server';

import { handleStripeWebhookEvent, verifyStripeWebhookEvent } from '@/1_application/stripeWebhook';

export async function POST(request: Request) {
	const payload = await request.text();
	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
	}

	let event: Stripe.Event;
	try {
		event = await verifyStripeWebhookEvent(payload, signature);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid signature';
		return NextResponse.json({ error: message }, { status: 400 });
	}

	try {
		await handleStripeWebhookEvent(event);
	} catch (error) {
		console.error('Stripe webhook processing failed', event.type, error);
		// 500 so Stripe retries this event later - a transient DB failure
		// shouldn't silently drop a subscription state change.
		return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
	}

	return NextResponse.json({ received: true });
}
