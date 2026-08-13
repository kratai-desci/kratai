'use server';

import { signIn, signOut } from '@/3_infrastructure/auth';

/**
 * Server Actions around authentication - split out from auth.ts because
 * UserMenu.tsx (a Client Component) needs to call signOutAction directly,
 * which pulls this whole file into the client bundle graph. Next.js
 * requires files in that graph to declare 'use server' at the top (not
 * per-function) and to export only async functions - isSignInEnabled/
 * getSession in auth.ts don't fit that constraint, hence the split.
 */

/**
 * formData is optional so this keeps working as a plain `<form
 * action={signInAction}>` (Next still passes a FormData object in that
 * case) with no callbackUrl field - e.g. the landing page's sign-in
 * buttons, which always want /dashboard. The "try a public repo" flow
 * passes a callbackUrl so a visitor who signs in from there lands back on
 * the diagram they were just looking at instead of the dashboard.
 */
export async function signInAction(formData?: FormData): Promise<void> {
	const callbackUrl = formData?.get('callbackUrl');
	await signIn('github', { redirectTo: typeof callbackUrl === 'string' && callbackUrl ? callbackUrl : '/dashboard' });
}

export async function signOutAction(): Promise<void> {
	await signOut({ redirectTo: '/' });
}
