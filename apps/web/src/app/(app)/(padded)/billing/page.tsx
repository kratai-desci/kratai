import { CreditCard } from 'lucide-react';
import Link from 'next/link';

import { createPortalSessionAction } from '@/1_application/billing';
import { getPlanStatus, isBillingConfigured } from '@/1_application/plan';
import { CancelSubscriptionButton } from '@/components/pricing/CancelSubscriptionButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default async function BillingPage() {
	const status = await getPlanStatus();

	if (status.plan === 'free') {
		return (
			<div className="mx-auto flex max-w-xl flex-col gap-6">
				<h1 className="text-3xl font-semibold text-ink">Billing</h1>
				<Card className="flex flex-col items-center gap-4 py-10 text-center hover:border-line hover:shadow-none">
					<p className="text-ink-2">You&apos;re on the Free plan - nothing to manage yet.</p>
					<Button asChild>
						<Link href="/pricing">View plans</Link>
					</Button>
				</Card>
			</div>
		);
	}

	const priceLabel = status.billingInterval === 'year' ? '$30/year' : '$5/month';
	const billingConfigured = isBillingConfigured();

	return (
		<div className="mx-auto flex max-w-xl flex-col gap-6">
			<h1 className="text-3xl font-semibold text-ink">Billing</h1>

			<Card className="flex flex-col gap-4 hover:border-line hover:shadow-none">
				<div className="flex items-center justify-between">
					<h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Subscription</h2>
					<Badge variant="brand">Pro</Badge>
				</div>
				<div className="flex items-center justify-between text-sm">
					<span className="text-ink-2">Plan</span>
					<span className="text-ink">Pro - {priceLabel}</span>
				</div>
				{!billingConfigured && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-ink-2">Payment method</span>
						<span className="flex items-center gap-2 text-ink">
							<CreditCard className="size-4 text-ink-3" />
							•••• 4242
						</span>
					</div>
				)}
			</Card>

			{!billingConfigured && (
				<p className="text-center text-xs text-ink-3">
					This is demo billing data - no real payment method is on file and no real subscription
					exists yet.
				</p>
			)}

			<div className="flex justify-end">
				{billingConfigured ? (
					<form action={createPortalSessionAction}>
						<Button type="submit">Manage billing</Button>
					</form>
				) : (
					<CancelSubscriptionButton />
				)}
			</div>
		</div>
	);
}
