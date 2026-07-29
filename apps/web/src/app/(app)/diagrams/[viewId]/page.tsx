import { notFound } from 'next/navigation';

import { applyConfigFilters, generateDiagramHtml, getDiagramData } from '@/1_application/diagram';
import { getView } from '@/1_application/queries';
import { DiagramFrame } from '@/components/diagram/DiagramFrame';

interface DiagramPageProps {
	params: Promise<{ viewId: string }>;
}

export default async function DiagramPage({ params }: DiagramPageProps) {
	const { viewId } = await params;
	const view = await getView(viewId);
	if (!view) notFound();

	const data = await getDiagramData(view.repoFullName, view.branch, view.config);
	const filtered = applyConfigFilters(data, view.config);
	const { html } = generateDiagramHtml(filtered, view.name, view.config);

	return (
		<DiagramFrame html={html} viewId={view.id} repoFullName={view.repoFullName} branch={view.branch} />
	);
}
