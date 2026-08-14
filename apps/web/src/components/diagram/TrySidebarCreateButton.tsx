'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { signInAction } from '@/1_application/authActions';
import { trackEvent } from '@/lib/analytics/gtag';

const buttonClassName =
	'rounded-md p-1 text-ink-3 transition-colors hover:bg-surface hover:text-brand-ink';

/**
 * The sidebar's "+" on app/try/[owner]/[repo] - split into its own
 * 'use client' component (see ShareWithTeamButton's comment for why) so
 * both branches can be tracked: an already-signed-in visitor goes straight
 * to /new, an anonymous one gets funneled through sign-in first (see
 * TryDiagramSidebar's own comments on createHref/callbackUrl).
 */
export function TrySidebarCreateButton({
	repo,
	createHref,
	callbackUrl,
}: {
	repo: string;
	createHref?: string;
	callbackUrl: string;
}) {
	if (createHref) {
		return (
			<Link
				href={createHref}
				onClick={() => trackEvent('try_sidebar_create_click', { repo, already_signed_in: true })}
				className={buttonClassName}
				aria-label="New diagram"
			>
				<Plus className="size-4" />
			</Link>
		);
	}

	return (
		<form
			action={signInAction}
			onSubmit={() => trackEvent('try_sidebar_create_click', { repo, already_signed_in: false })}
		>
			<input type="hidden" name="callbackUrl" value={callbackUrl} />
			<button
				type="submit"
				title="Sign in with GitHub to create a diagram"
				className={buttonClassName}
				aria-label="Create diagram"
			>
				<Plus className="size-4" />
			</button>
		</form>
	);
}
