'use client';

import { Download, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

const STORAGE_KEY = 'download-banner-dismissed';

export function DownloadBanner() {
	const [visible, setVisible] = React.useState(false);

	React.useEffect(() => {
		let dismissed = false;
		try {
			dismissed = localStorage.getItem(STORAGE_KEY) === '1';
		} catch {
			// localStorage unavailable (private browsing, etc.) - show the banner.
		}
		// eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage, mirrors ThemeProvider's pattern
		setVisible(!dismissed);
	}, []);

	const dismiss = () => {
		setVisible(false);
		try {
			localStorage.setItem(STORAGE_KEY, '1');
		} catch {
			// localStorage unavailable - dismissal just won't persist across reloads.
		}
	};

	if (!visible) return null;

	return (
		<div className="flex items-center gap-3 border-b border-line bg-surface-2 px-6 py-2 text-sm text-ink-2">
			<Download className="size-3.5 shrink-0 text-brand-ink" />
			<span className="flex-1">
				Get the full AI workflow — install the kratai{' '}
				<Link href="/download" className="font-medium text-brand-ink hover:underline">
					VS Code extension
				</Link>
				.
			</span>
			<button
				type="button"
				onClick={dismiss}
				aria-label="Dismiss"
				className="shrink-0 rounded p-1 text-ink-3 transition-colors hover:bg-surface hover:text-ink"
			>
				<X className="size-3.5" />
			</button>
		</div>
	);
}
