'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { githubFileUrl } from '@/1_application/githubUrls';

interface DiagramMessage {
	command: 'saveAsMD' | 'openSettings' | 'openFile' | 'openMember';
	filePath?: string;
	lineNumber?: number;
	endLineNumber?: number;
}

export function DiagramFrame({
	html,
	viewId,
	repoFullName,
	branch,
}: {
	html: string;
	viewId: string;
	repoFullName: string;
	branch: string;
}) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const router = useRouter();

	useEffect(() => {
		function handleMessage(event: MessageEvent<DiagramMessage>) {
			// Only accept messages from our own iframe.
			if (event.source !== iframeRef.current?.contentWindow) return;

			const message = event.data;
			switch (message?.command) {
				case 'saveAsMD': {
					const link = document.createElement('a');
					link.href = `/api/diagrams/${viewId}/export`;
					document.body.appendChild(link);
					link.click();
					link.remove();
					break;
				}
				case 'openSettings':
					router.push(`/configure?viewId=${viewId}`);
					break;
				case 'openFile':
					if (message.filePath) {
						window.open(githubFileUrl(repoFullName, branch, message.filePath), '_blank', 'noreferrer');
					}
					break;
				case 'openMember':
					if (message.filePath) {
						window.open(
							githubFileUrl(
								repoFullName,
								branch,
								message.filePath,
								message.lineNumber,
								message.endLineNumber
							),
							'_blank',
							'noreferrer'
						);
					}
					break;
			}
		}

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [viewId, repoFullName, branch, router]);

	return (
		<iframe
			ref={iframeRef}
			srcDoc={html}
			title="Architecture diagram"
			className="h-full w-full border-0"
			sandbox="allow-scripts"
		/>
	);
}
