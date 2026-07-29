import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
	'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
	{
		variants: {
			variant: {
				neutral: 'border border-line text-ink-3',
				brand: 'bg-brand/15 text-brand-ink',
				success: 'bg-success/15 text-success-2',
				warning: 'bg-warning/15 text-warning-2',
				danger: 'bg-danger/15 text-danger-2',
			},
		},
		defaultVariants: {
			variant: 'neutral',
		},
	}
);

interface BadgeProps extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge };
