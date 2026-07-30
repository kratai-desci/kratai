'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { setMockPlanAction } from '@/1_application/planActions';
import type { Plan } from '@/2_domain';
import { Button } from '@/components/ui/button';

/**
 * Dev/demo-only preview toggle - flips the mock plan cookie so the Free/Pro
 * UI can be reviewed without real billing (REQUIREMENTS.md §9.3). Goes away
 * once a real PlanRepository exists.
 */
export function PlanPreviewToggle({ current }: { current: Plan }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function setPlan(plan: Plan) {
		startTransition(async () => {
			await setMockPlanAction(plan);
			router.refresh();
		});
	}

	return (
		<div className="flex items-center gap-2">
			<Button
				size="sm"
				variant={current === 'free' ? 'primary' : 'secondary'}
				disabled={isPending}
				onClick={() => setPlan('free')}
			>
				Free
			</Button>
			<Button
				size="sm"
				variant={current === 'pro' ? 'primary' : 'secondary'}
				disabled={isPending}
				onClick={() => setPlan('pro')}
			>
				Pro
			</Button>
		</div>
	);
}
