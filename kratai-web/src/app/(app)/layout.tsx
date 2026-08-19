import { redirect } from 'next/navigation';

import { getSession, isSignInEnabled } from '@/1_application/auth';
import { Header } from '@/components/layout/Header';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
	// Only gate on a real session once GitHub OAuth is actually configured -
	// otherwise every page here stays reachable on mock data, same as before
	// real sign-in existed.
	if (isSignInEnabled()) {
		const session = await getSession();
		if (!session) redirect('/');
	}

	return (
		<div className="flex h-screen flex-col">
			<Header />
			<main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
		</div>
	);
}
