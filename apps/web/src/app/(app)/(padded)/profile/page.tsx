import { LogOut } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/data';

export default async function ProfilePage() {
	const user = await getCurrentUser();

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

			<div className="flex justify-end">
				<Button asChild variant="secondary">
					<Link href="/">
						<LogOut className="size-4" />
						Sign out
					</Link>
				</Button>
			</div>

			<p className="text-center text-xs text-ink-3">
				This is demo data - account management isn&apos;t wired up to real GitHub OAuth yet.
			</p>
		</div>
	);
}
