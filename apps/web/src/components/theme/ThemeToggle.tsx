'use client';

import { Check, Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const OPTIONS = [
	{ value: 'light', label: 'Light', icon: Sun },
	{ value: 'dark', label: 'Dark', icon: Moon },
	{ value: 'system', label: 'System', icon: Laptop },
] as const;

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	// Avoid rendering theme-dependent icon before the client has hydrated
	// and resolved localStorage/system preference (prevents a mismatch
	// flash between server and client render). This is next-themes' own
	// documented pattern for theme-dependent UI, not general effect misuse.
	const [mounted, setMounted] = React.useState(false);
	// eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount flag for SSR-safe theme rendering
	React.useEffect(() => setMounted(true), []);

	const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[1];
	const CurrentIcon = current.icon;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
				aria-label="Change theme"
			>
				{mounted ? <CurrentIcon className="size-4" /> : <span className="block size-4" />}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{OPTIONS.map(({ value, label, icon: Icon }) => (
					<DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
						<Icon className="size-3.5" />
						{label}
						{theme === value && <Check className="ml-auto size-3.5 text-brand-ink" />}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
