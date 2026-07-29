import Image from 'next/image';

import { cn } from '@/lib/utils';

function initials(name: string): string {
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? '';
	const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
	return (first + last).toUpperCase();
}

export function Avatar({
	name,
	src,
	size = 32,
	className,
}: {
	name: string;
	src?: string | null;
	size?: number;
	className?: string;
}) {
	if (src) {
		return (
			<Image
				src={src}
				alt={name}
				width={size}
				height={size}
				className={cn('rounded-full object-cover', className)}
			/>
		);
	}

	return (
		<span
			className={cn(
				'flex shrink-0 items-center justify-center rounded-full bg-brand/20 font-semibold text-brand',
				className
			)}
			style={{ width: size, height: size, fontSize: size * 0.4 }}
			aria-hidden
		>
			{initials(name)}
		</span>
	);
}
