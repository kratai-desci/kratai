import Image from 'next/image';

import { InstallExtensionButton } from '@/components/download/InstallExtensionButton';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Download - kratai' };

export default function DownloadPage() {
	return (
		<div className="flex max-w-5xl flex-col gap-8">
			<div>
				<h1 className="text-3xl font-semibold text-ink">Download kratai</h1>
				<p className="mt-1 text-sm text-ink-2">What you can do with the VS Code extension.</p>
			</div>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
				<div className="flex flex-col gap-10">
					<div>
						<h2 className="font-semibold text-ink">Generate diagrams from your local code</h2>
						<p className="mt-1 text-sm text-ink-2">
							Point it at any folder or repo on your machine and get the same interactive
							diagram as the web app - no GitHub connection needed.
						</p>
						<Image
							src="/screenshots/demo.gif"
							alt="kratai in action - interactive code visualization"
							width={1920}
							height={1080}
							className="mt-3 w-full rounded-lg border border-line"
							unoptimized
						/>
					</div>

					<div>
						<h2 className="font-semibold text-ink">Give your AI agent the diagram</h2>
						<p className="mt-1 text-sm text-ink-2">
							A local MCP server exposes your saved diagram to your AI agent, so it references
							your real classes and relationships instead of guessing from raw files.
						</p>
						<Image
							src="/screenshots/demo_ss_4.png"
							alt="Example @kratai prompt asking the agent to build a feature"
							width={934}
							height={256}
							className="mt-3 w-2/3 rounded-lg border border-line"
						/>
					</div>

					<div>
						<h2 className="font-semibold text-ink">See what changed, right on the diagram</h2>
						<p className="mt-1 text-sm text-ink-2">
							Git diff visualization highlights added, removed, and modified classes and members
							directly on the diagram, so you can review changes without leaving the visual.
						</p>
						<Image
							src="/screenshots/demo_ss_1.png"
							alt="Class diagram with git diff highlighting - green for added, red for removed members"
							width={3420}
							height={2146}
							className="mt-3 w-full rounded-lg border border-line"
						/>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<Card className="flex flex-col gap-3 hover:border-line hover:shadow-none">
						<div>
							<h2 className="font-semibold text-ink">VS Code extension</h2>
							<p className="mt-1 text-sm text-ink-2">
								Adds the architecture-aware SKILL and a local MCP server to your editor, so your
								AI agent can reference your real classes and relationships instead of guessing.
							</p>
						</div>
						<InstallExtensionButton />
					</Card>

					<Card className="flex flex-col gap-3 opacity-60 hover:border-line hover:shadow-none">
						<div>
							<h2 className="font-semibold text-ink">Desktop app</h2>
							<p className="mt-1 text-sm text-ink-2">
								Generate and browse diagrams as a standalone app, without an editor.
							</p>
						</div>
						<div className="rounded-md border border-line px-4 py-2 text-center text-sm font-medium text-ink-3">
							Coming soon
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
