'use client';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

function DropdownMenuContent({
	className,
	sideOffset = 6,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				sideOffset={sideOffset}
				className={cn(
					'z-50 min-w-[10rem] rounded-md border border-line bg-panel p-1 shadow-xl',
					className
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuItem({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
	return (
		<DropdownMenuPrimitive.Item
			className={cn(
				'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-ink-2 outline-none transition-colors data-[highlighted]:bg-surface-2 data-[highlighted]:text-brand',
				className
			)}
			{...props}
		/>
	);
}

function DropdownMenuCheckboxItem({
	className,
	children,
	checked,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
	return (
		<DropdownMenuPrimitive.CheckboxItem
			checked={checked}
			className={cn(
				'flex cursor-pointer items-center gap-2 rounded py-1.5 pl-7 pr-2 text-sm text-ink-2 outline-none transition-colors data-[highlighted]:bg-surface-2 data-[highlighted]:text-brand',
				className
			)}
			{...props}
		>
			<DropdownMenuPrimitive.ItemIndicator className="absolute left-2 flex items-center">
				<Check className="size-3.5 text-brand" />
			</DropdownMenuPrimitive.ItemIndicator>
			{children}
		</DropdownMenuPrimitive.CheckboxItem>
	);
}

function DropdownMenuSeparator({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator className={cn('my-1 h-px bg-line', className)} {...props} />
	);
}

function DropdownMenuLabel({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			className={cn('px-2 py-1.5 text-xs font-semibold text-ink-3 uppercase tracking-wide', className)}
			{...props}
		/>
	);
}

export {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
};
