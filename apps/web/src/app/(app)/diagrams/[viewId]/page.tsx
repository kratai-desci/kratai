import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DiagramFrame } from '@/components/diagram/DiagramFrame';
import { getView } from '@/lib/data';
import { applyConfigFilters, generateDiagramHtml, getFixtureDiagramData } from '@/lib/diagram/generateDiagramHtml';

interface DiagramPageProps {
	params: Promise<{ viewId: string }>;
}

export default async function DiagramPage({ params }: DiagramPageProps) {
	const { viewId } = await params;
	const view = await getView(viewId);
	if (!view) notFound();

	const filtered = applyConfigFilters(getFixtureDiagramData(), view.config);
	const { html } = generateDiagramHtml(filtered, view.name, view.config);

	return (
		<div className="flex h-[calc(100vh-9rem)] flex-col gap-4">
			<Link href="/dashboard" className="flex w-fit items-center gap-1 text-sm text-ink-2 hover:text-brand">
				<ArrowLeft className="size-3.5" />
				Back to dashboard
			</Link>
			<div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-line">
				<DiagramFrame html={html} viewId={view.id} repoFullName={view.repoFullName} branch={view.branch} />
			</div>
		</div>
	);
}
