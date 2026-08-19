import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			className={cn(
				'rounded-lg border border-line bg-panel p-6 shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-colors hover:border-brand hover:shadow-[0_4px_16px_rgba(244,208,63,0.15)]',
				className
			)}
			{...props}
		/>
	);
}

export { Card };
