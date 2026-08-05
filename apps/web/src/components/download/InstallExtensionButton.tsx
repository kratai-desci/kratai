'use client';

import { ArrowUpRight } from 'lucide-react';

import { trackEvent } from '@/lib/analytics/gtag';

const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/items?itemName=kratai-core.kratai';

export function InstallExtensionButton() {
	return (
		<a
			href={MARKETPLACE_URL}
			target="_blank"
			rel="noopener noreferrer"
			onClick={() => trackEvent('download_vscode_extension')}
			className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-on-brand transition-all duration-150 ease-out hover:-translate-y-px hover:bg-brand-gold hover:shadow-[0_4px_12px_rgba(244,208,63,0.3)]"
		>
			Install from Marketplace
			<ArrowUpRight className="size-4" />
		</a>
	);
}
