'use client';

import { useState, useTransition } from 'react';

import { cancelMockSubscriptionAction } from '@/1_application/billing';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

/** Only rendered on the billing page's mock branch (Stripe not configured) - real cancellation goes through the Stripe portal instead. */
export function CancelSubscriptionButton() {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	function handleCancel() {
		startTransition(async () => {
			await cancelMockSubscriptionAction();
		});
	}

	return (
		<>
			<Button variant="secondary" onClick={() => setConfirmOpen(true)}>
				Cancel subscription
			</Button>
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cancel your Pro subscription?</DialogTitle>
						<DialogDescription>
							You&apos;ll drop back to the Free plan (1 saved diagram) - if you have more than one
							saved, the extras stay but you won&apos;t be able to create new ones until you delete
							down to the limit or upgrade again. This is a demo action - no real subscription
							exists yet.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="secondary" onClick={() => setConfirmOpen(false)}>
							Keep Pro
						</Button>
						<Button variant="danger" onClick={handleCancel} disabled={isPending}>
							{isPending ? 'Canceling...' : 'Cancel subscription'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
