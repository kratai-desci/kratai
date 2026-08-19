import { Check, Clock } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';

import { getPlanStatus } from '@/1_application/plan';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UpgradeButton } from '@/components/pricing/UpgradeButton';

export const metadata = { title: 'Pricing - kratai' };

function ComingSoonBadge() {
	return <Badge variant="neutral">Coming soon</Badge>;
}

export default async function PricingPage() {
	const { plan } = await getPlanStatus();

	return (
		<div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
			<Link href="/dashboard" className="mb-10 flex items-center gap-3">
				<NextImage
					src="/logo-white.png"
					alt="kratai"
					width={28}
					height={28}
					className="opacity-90 light:invert"
				/>
				<span className="text-lg font-semibold text-ink">kratai</span>
			</Link>

			<div className="mb-12 text-center">
				<h1 className="text-4xl font-bold text-ink">Simple pricing</h1>
				<p className="mt-3 text-lg text-ink-2">Start free. Upgrade when you outgrow it.</p>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				{/* Free */}
				<Card className="flex flex-col gap-6 hover:border-line hover:shadow-none">
					<div>
						<div className="mb-2 flex items-center gap-2">
							<h2 className="text-xl font-semibold text-ink">Free</h2>
							{plan === 'free' && <Badge variant="brand">Current plan</Badge>}
						</div>
						<p className="text-3xl font-bold text-ink">$0</p>
						<div className="mt-2">
							<Badge variant="neutral">Free forever</Badge>
						</div>
					</div>
					<ul className="flex flex-1 flex-col gap-3 text-sm text-ink-2">
						<li className="flex items-center gap-2">
							<Check className="size-4 shrink-0 text-success-2" />1 saved diagram
						</li>
						<li className="flex items-center gap-2">
							<Check className="size-4 shrink-0 text-success-2" />
							Full config panel (folders, filters, HTTP + framework detection)
						</li>
						<li className="flex items-center gap-2">
							<Check className="size-4 shrink-0 text-success-2" />
							Export as Markdown
						</li>
					</ul>
				</Card>

				{/* Pro */}
				<Card className="flex flex-col gap-6 border-brand/40 hover:shadow-none">
					<div>
						<div className="mb-2 flex items-center gap-2">
							<h2 className="text-xl font-semibold text-ink">Pro</h2>
							{plan === 'pro' && <Badge variant="brand">Current plan</Badge>}
						</div>
						<p className="text-3xl font-bold text-ink">
							$5<span className="text-base font-normal text-ink-3">/month</span>
						</p>
						<div className="mt-2 flex items-center gap-2 text-sm">
							<span className="text-ink-2">
								or <span className="font-semibold text-ink">$30/year</span>
							</span>
							<Badge variant="warning">50% off - limited time</Badge>
						</div>
					</div>
					<ul className="flex flex-1 flex-col gap-3 text-sm text-ink-2">
						<li className="flex items-center gap-2">
							<Check className="size-4 shrink-0 text-success-2" />
							Unlimited saved diagrams
						</li>
						<li className="flex items-center justify-between gap-2">
							<span className="flex items-center gap-2 text-ink-3">
								<Clock className="size-4 shrink-0" />
								Share diagrams with other users
							</span>
							<ComingSoonBadge />
						</li>
						<li className="flex items-center justify-between gap-2">
							<span className="flex items-center gap-2 text-ink-3">
								<Clock className="size-4 shrink-0" />
								Desktop app access
							</span>
							<ComingSoonBadge />
						</li>
					</ul>
					{plan === 'pro' ? (
						<div className="flex flex-col items-center gap-2">
							<p className="text-sm text-ink-2">You&apos;re on Pro. Thank you!</p>
							<Button asChild variant="secondary">
								<Link href="/billing">Manage billing</Link>
							</Button>
						</div>
					) : (
						<div className="flex flex-col gap-3 sm:flex-row">
							<UpgradeButton interval="month" label="$5 / month" />
							<UpgradeButton interval="year" label="$30 / year" />
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}
