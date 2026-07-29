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

export async function signInAction(): Promise<void> {
	await signIn('github', { redirectTo: '/dashboard' });
}

export async function signOutAction(): Promise<void> {
	await signOut({ redirectTo: '/' });
}
