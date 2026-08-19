'use client';

import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics/gtag';

/**
 * Markdown is already computed server-side (see generatePublicDiagram) and
 * passed in as a plain string - this just turns it into a file download, no
 * server round-trip needed (unlike the authenticated /api/diagrams/[viewId]/
 * export route, there's no viewId here to fetch by).
 */
export function DownloadMarkdownButton({
	markdown,
	fileName,
	repo,
}: {
	markdown: string;
	fileName: string;
	repo: string;
}) {
	function handleDownload() {
		trackEvent('try_export_md', { repo });
		const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	}

	return (
		<Button size="sm" onClick={handleDownload}>
			<Download className="size-4" />
			Export as MD for AI Agents
		</Button>
	);
}
