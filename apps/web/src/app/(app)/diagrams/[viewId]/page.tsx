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
		<DiagramFrame html={html} viewId={view.id} repoFullName={view.repoFullName} branch={view.branch} />
	);
}
