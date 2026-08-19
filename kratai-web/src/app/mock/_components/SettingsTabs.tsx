'use client';

import Link from 'next/link';

import { cn } from '@/lib/utils';

import { mockSettingsHref, mockSettingsPatternsHref } from '@/app/mock/_data';

export function SettingsTabs({ repo, active }: { repo: string; active: 'general' | 'pattern' }) {
	const tabs = [
		{ key: 'general' as const, label: 'General principles', href: mockSettingsHref(repo) },
		{ key: 'pattern' as const, label: 'Design patterns', href: mockSettingsPatternsHref(repo) },
	];

	return (
		<div className="flex gap-1 border-b border-line">
			{tabs.map((tab) => (
				<Link
					key={tab.key}
					href={tab.href}
					className={cn(
						'-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
						active === tab.key
							? 'border-brand text-ink'
							: 'border-transparent text-ink-3 hover:text-ink'
					)}
				>
					{tab.label}
				</Link>
			))}
		</div>
	);
}
