import { ArrowUpRight, Bot, Clock, Monitor } from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/items?itemName=kratai-core.kratai';

export const metadata = { title: 'Download - kratai' };

export default function DownloadPage() {
	return (
		<div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
			<Link href="/dashboard" className="mb-10 flex items-center gap-3">
				<NextImage
					src="/logo-white.png"
					alt="kratai"
					width={28}
					height={28}
					className="opacity-90 light:invert"
				/>
				<span className="text-lg font-semibold text-ink">kratai</span>
			</Link>

			<div className="mb-12 text-center">
				<h1 className="text-4xl font-bold text-ink">Get kratai on your machine</h1>
				<p className="mt-3 text-lg text-ink-2">
					Bring the architecture-aware SKILL and MCP server into your editor.
				</p>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				<Card className="flex flex-col gap-6 border-brand/40 hover:shadow-none">
					<div>
						<div className="mb-2 flex items-center gap-2">
							<Bot className="size-5 text-brand-ink" />
							<h2 className="text-xl font-semibold text-ink">VS Code Extension</h2>
						</div>
						<Badge variant="success">Available now</Badge>
					</div>
					<p className="flex-1 text-sm text-ink-2">
						Install the kratai extension for the pre-configured SKILL, a local MCP server, and
						git-diff-aware navigation on top of your saved diagrams.
					</p>
					<a
						href={MARKETPLACE_URL}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-on-brand transition-all duration-150 ease-out hover:-translate-y-px hover:bg-brand-gold hover:shadow-[0_4px_12px_rgba(244,208,63,0.3)]"
					>
						Install from Marketplace
						<ArrowUpRight className="size-4" />
					</a>
				</Card>

				<Card className="flex flex-col gap-6 hover:border-line hover:shadow-none">
					<div>
						<div className="mb-2 flex items-center gap-2">
							<Monitor className="size-5 text-ink-3" />
							<h2 className="text-xl font-semibold text-ink">Desktop App</h2>
						</div>
						<Badge variant="neutral">
							<Clock className="mr-1 size-3" />
							Coming soon
						</Badge>
					</div>
					<p className="flex-1 text-sm text-ink-2">
						A standalone desktop app for browsing and generating diagrams without an editor open.
					</p>
				</Card>
			</div>
		</div>
	);
}
