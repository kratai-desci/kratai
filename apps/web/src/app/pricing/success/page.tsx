import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { isBillingConfigured } from '@/1_application/plan';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Welcome to Pro - kratai' };

interface PurchaseSuccessPageProps {
	searchParams: Promise<{ interval?: string }>;
}

export default async function PurchaseSuccessPage({ searchParams }: PurchaseSuccessPageProps) {
	const { interval } = await searchParams;
	const priceLabel = interval === 'year' ? '$30/year' : '$5/month';

	return (
		<div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
			<CheckCircle2 className="mb-6 size-16 text-success-2" />
			<h1 className="text-3xl font-bold text-ink">You&apos;re on Pro!</h1>
			<p className="mt-3 text-ink-2">{priceLabel} - unlimited saved diagrams are unlocked.</p>
			{!isBillingConfigured() && (
				<p className="mt-6 text-xs text-ink-3">
					This is a demo purchase - no real payment was processed.
				</p>
			)}
			<div className="mt-8 flex items-center gap-3">
				<Button asChild variant="secondary">
					<Link href="/billing">Manage billing</Link>
				</Button>
				<Button asChild>
					<Link href="/dashboard">Go to dashboard</Link>
				</Button>
			</div>
		</div>
	);
}
