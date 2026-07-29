import { auth, isGitHubOAuthConfigured } from '@/3_infrastructure/auth';
import type { AppSession } from '@/3_infrastructure/auth';

/**
 * Read-side use cases around authentication, for Server Components only
 * (see authActions.ts for the Server Actions Client Components call).
 * Depends only on 3_infrastructure/auth - presentation code only ever
 * imports from 1_application, never reaches into 3_infrastructure directly.
 */

/** Whether real GitHub sign-in is configured (AUTH_GITHUB_ID/SECRET set). When
 * false, the app runs entirely on mock data and skips the auth gate. */
export function isSignInEnabled(): boolean {
	return isGitHubOAuthConfigured();
}

export async function getSession(): Promise<AppSession | null> {
	return auth();
}
