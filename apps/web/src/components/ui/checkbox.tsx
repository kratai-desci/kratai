'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Checkbox({
	className,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			className={cn(
				'peer flex size-4 shrink-0 items-center justify-center rounded border border-line bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			{...props}
		>
			<CheckboxPrimitive.Indicator className="flex items-center justify-center text-on-brand">
				{props.checked === 'indeterminate' ? (
					<Minus className="size-3" strokeWidth={3} />
				) : (
					<Check className="size-3" strokeWidth={3} />
				)}
			</CheckboxPrimitive.Indicator>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
