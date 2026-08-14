import { notFound } from 'next/navigation';
import Link from 'next/link';

import { getSession, isSignInEnabled } from '@/1_application/auth';
import { parseRepoInput } from '@/1_application/githubUrls';
import { generatePublicDiagram } from '@/1_application/publicDiagram';
import { DiagramFrame } from '@/components/diagram/DiagramFrame';
import { DownloadMarkdownButton } from '@/components/diagram/DownloadMarkdownButton';
import { ShareWithTeamButton } from '@/components/diagram/ShareWithTeamButton';
import { TryDiagramSidebar } from '@/components/diagram/TryDiagramSidebar';
import { Button } from '@/components/ui/button';

interface TryRepoPageProps {
	params: Promise<{ owner: string; repo: string }>;
}

export default async function TryRepoPage({ params }: TryRepoPageProps) {
	const { owner, repo } = await params;
	// Re-validated here (not just trusted from app/try's form), since this
	// route is directly reachable by URL - see parseRepoInput's own comment
	// on why this feeds a `git clone` command and needs to stay strict.
	const repoFullName = parseRepoInput(`${owner}/${repo}`);
	if (!repoFullName) notFound();

	const callbackUrl = `/try/${repoFullName}`;
	const session = isSignInEnabled() ? await getSession() : null;
	// Already signed in (viewing this anonymous preview post-auth, or just
	// following a shared /try link) - the sidebar's create button should act
	// like the real dashboard's, not send them through sign-in again.
	const createHref = session ? '/new' : undefined;

	let result;
	try {
		result = await generatePublicDiagram(repoFullName);
	} catch (error) {
		return (
			<div className="flex h-full min-h-0">
				<TryDiagramSidebar repoFullName={repoFullName} createHref={createHref} callbackUrl={callbackUrl} />
				<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
					<p className="text-lg font-semibold text-ink">Couldn&apos;t generate a diagram</p>
					<p className="text-sm text-ink-2">
						{error instanceof Error ? error.message : 'Something went wrong.'}
					</p>
					<Button asChild variant="secondary">
						<Link href="/try">Try another repo</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0">
			<TryDiagramSidebar
				repoFullName={result.repoFullName}
				entry={{
					branch: result.branch,
					name: `${result.repoFullName.split('/')[1]} diagram`,
					commitSha: result.commitSha,
				}}
				createHref={createHref}
				callbackUrl={callbackUrl}
			/>
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-2 px-6 py-3">
					<div>
						<p className="text-sm text-ink-2">
							Anonymous preview of <span className="font-medium text-ink">{result.repoFullName}</span>{' '}
							@ {result.branch}
							<span className="ml-2 text-ink-3">
								({result.classCount} classes · {result.relationshipCount} relationships)
							</span>
						</p>
						<p className="mt-0.5 text-xs text-ink-3">
							Export as Markdown to give AI coding agents accurate architecture context.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<DownloadMarkdownButton
							markdown={result.markdown}
							fileName={`${result.repoFullName.split('/')[1]}.md`}
							repo={result.repoFullName}
						/>
						{isSignInEnabled() && <ShareWithTeamButton repo={result.repoFullName} />}
					</div>
				</div>
				<div className="min-h-0 flex-1">
					<DiagramFrame
						html={result.html}
						repoFullName={result.repoFullName}
						branch={result.branch}
						signInCallbackUrl={callbackUrl}
					/>
				</div>
			</div>
		</div>
	);
}
