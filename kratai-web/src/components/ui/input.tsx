import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			className={cn(
				'w-full rounded border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/10 focus-visible:outline-none',
				className
			)}
			{...props}
		/>
	);
}

export { Input };
