'use client';

import { Users } from 'lucide-react';

import { signInAction } from '@/1_application/authActions';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics/gtag';

/**
 * Team sharing doesn't exist yet - this button's only job is funneling
 * interest into sign-up (see signInAction), same as everything else on
 * app/try. Split into its own 'use client' component (rather than the
 * plain server-rendered <form> this used to be) purely so the click can be
 * tracked - trackEvent() fires synchronously in onSubmit, before the
 * form's own native submit (to signInAction) proceeds.
 */
export function ShareWithTeamButton({ repo }: { repo: string }) {
	return (
		<form action={signInAction} onSubmit={() => trackEvent('try_share_click', { repo })}>
			<Button type="submit" size="sm">
				<Users className="size-4" />
				Share with team
			</Button>
		</form>
	);
}
