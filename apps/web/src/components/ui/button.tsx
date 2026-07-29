import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
	{
		variants: {
			variant: {
				primary:
					'bg-brand text-surface hover:-translate-y-px hover:bg-brand-gold hover:shadow-[0_4px_12px_rgba(244,208,63,0.3)]',
				secondary:
					'border-2 border-line bg-transparent text-ink hover:border-brand hover:text-brand',
				ghost: 'bg-transparent text-ink-2 hover:text-brand',
				danger: 'bg-danger text-ink hover:bg-danger-2',
			},
			size: {
				default: 'px-6 py-3',
				sm: 'px-4 py-2 text-xs',
				icon: 'h-9 w-9 p-0',
			},
		},
		defaultVariants: {
			variant: 'primary',
			size: 'default',
		},
	}
);

interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
	const Comp = asChild ? Slot : 'button';
	return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
