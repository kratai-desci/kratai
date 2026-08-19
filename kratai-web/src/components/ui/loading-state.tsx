import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export function LoadingState({ message, className }: { message: string; className?: string }) {
	return (
		<div className={cn('flex flex-col items-center justify-center gap-3 text-ink-2', className)}>
			<Loader2 className="size-6 animate-spin text-brand" />
			<p className="text-sm">{message}</p>
		</div>
	);
}
