'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { signInAction } from '@/1_application/authActions';
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
	settingsHref,
	signInCallbackUrl,
}: {
	html: string;
	/** Absent for an anonymous (unsaved) diagram - see app/try. Export and
	 * settings have nothing to operate on without a saved view, so both
	 * trigger GitHub sign-in instead in that case (the whole point of
	 * showing an anonymous visitor the real authenticated UI, buttons and
	 * all, is that every action on it leads to signing up). */
	viewId?: string;
	repoFullName: string;
	branch: string;
	settingsHref?: string;
	signInCallbackUrl?: string;
}) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const router = useRouter();

	useEffect(() => {
		function triggerSignIn() {
			const formData = new FormData();
			if (signInCallbackUrl) formData.set('callbackUrl', signInCallbackUrl);
			void signInAction(formData);
		}

		function handleMessage(event: MessageEvent<DiagramMessage>) {
			// Only accept messages from our own iframe.
			if (event.source !== iframeRef.current?.contentWindow) return;

			const message = event.data;
			switch (message?.command) {
				case 'saveAsMD': {
					if (!viewId) {
						triggerSignIn();
						break;
					}
					const link = document.createElement('a');
					link.href = `/api/diagrams/${viewId}/export`;
					document.body.appendChild(link);
					link.click();
					link.remove();
					break;
				}
				case 'openSettings':
					if (!viewId) {
						triggerSignIn();
						break;
					}
					router.push(settingsHref ?? `/configure?viewId=${viewId}`);
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
	}, [viewId, repoFullName, branch, router, settingsHref, signInCallbackUrl]);

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
