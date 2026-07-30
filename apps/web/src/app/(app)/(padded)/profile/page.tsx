import { LogOut } from 'lucide-react';
import Link from 'next/link';

import { isSignInEnabled } from '@/1_application/auth';
import { signOutAction } from '@/1_application/authActions';
import { getPlanStatus } from '@/1_application/plan';
import { getCurrentUser } from '@/1_application/queries';
import { PlanPreviewToggle } from '@/components/pricing/PlanPreviewToggle';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default async function ProfilePage() {
	const user = await getCurrentUser();
	const signInEnabled = isSignInEnabled();
	const planStatus = await getPlanStatus();

	return (
		<div className="mx-auto flex max-w-xl flex-col gap-6">
			<h1 className="text-3xl font-semibold text-ink">Profile</h1>

			<Card className="flex items-center gap-4 hover:border-line hover:shadow-none">
				<Avatar name={user.name} src={user.avatarUrl} size={56} />
				<div>
					<p className="text-lg font-semibold text-ink">{user.name}</p>
					<p className="text-sm text-ink-2">@{user.username}</p>
				</div>
			</Card>

			<Card className="flex flex-col gap-4 hover:border-line hover:shadow-none">
				<h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Account</h2>
				<div className="flex items-center justify-between text-sm">
					<span className="text-ink-2">Email</span>
					<span className="text-ink">{user.email}</span>
				</div>
				<div className="flex items-center justify-between text-sm">
					<span className="text-ink-2">Connected account</span>
					<Badge variant="brand">GitHub @{user.username}</Badge>
				</div>
			</Card>

			<Card className="flex flex-col gap-4 hover:border-line hover:shadow-none">
				<h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Plan</h2>
				<div className="flex items-center justify-between text-sm">
					<span className="text-ink-2">Current plan</span>
					<div className="flex items-center gap-2">
						<Badge variant={planStatus.plan === 'pro' ? 'brand' : 'neutral'}>
							{planStatus.plan === 'pro' ? 'Pro' : 'Free'}
						</Badge>
						<span className="text-xs text-ink-3">
							{planStatus.viewCount}/{planStatus.limit === Infinity ? '∞' : planStatus.limit} diagrams
						</span>
					</div>
				</div>
				<Button asChild variant="secondary" className="self-end">
					<Link href={planStatus.plan === 'free' ? '/pricing' : '/billing'}>
						{planStatus.plan === 'free' ? 'Upgrade to Pro' : 'Manage billing'}
					</Link>
				</Button>
				<div className="border-t border-line pt-4">
					<p className="mb-2 text-xs text-ink-3">
						Preview mode (dev only) - no real billing is wired up yet, this just previews the
						Free/Pro UI.
					</p>
					<PlanPreviewToggle current={planStatus.plan} />
				</div>
			</Card>

			<div className="flex justify-end">
				<form action={signOutAction}>
					<Button type="submit" variant="secondary">
						<LogOut className="size-4" />
						Sign out
					</Button>
				</form>
			</div>

			{!signInEnabled && (
				<p className="text-center text-xs text-ink-3">
					This is demo data - account management isn&apos;t wired up to real GitHub OAuth yet.
				</p>
			)}
		</div>
	);
}
