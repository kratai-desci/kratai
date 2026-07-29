import { notFound } from 'next/navigation';

import { applyConfigFilters, generateDiagramHtml } from '@/1_application/diagram';
import { generateAndCacheView, isViewStale } from '@/1_application/generateView';
import { getView } from '@/1_application/queries';
import { DiagramFrame } from '@/components/diagram/DiagramFrame';
import { FailedPanel } from '@/components/diagram/FailedPanel';
import { GeneratingPanel } from '@/components/diagram/GeneratingPanel';
import { RegeneratingBanner } from '@/components/diagram/RegeneratingBanner';
import { StaleBanner } from '@/components/diagram/StaleBanner';

interface DiagramPageProps {
	params: Promise<{ viewId: string }>;
}

export default async function DiagramPage({ params }: DiagramPageProps) {
	const { viewId } = await params;
	const view = await getView(viewId);
	if (!view) notFound();

	// Views saved before this caching feature existed have no status field
	// at all - treat that the same as 'idle' (never generated under this
	// schema) rather than falling through to the failed panel below.
	//
	// 'idle' only ever happens right after an explicit create/reconfigure
	// action navigated here (see ViewRepository.createView/updateView) - so
	// generating inline here is still behind an explicit user action, just
	// one navigation removed. This blocks the route's loading.tsx, same as
	// before caching existed. Every other status is reached by simply
	// opening an existing view, which must never block - that's what the
	// stale/generating/failed panels below are for.
	const needsFirstGeneration = !view.status || view.status === 'idle';
	const current = needsFirstGeneration ? await generateAndCacheView(view) : view;

	if (current.status === 'generating' && !current.diagramData) {
		return <GeneratingPanel message="Cloning and analyzing the repository..." className="h-full" />;
	}

	if (!current.diagramData) {
		return <FailedPanel viewId={current.id} error={current.lastError} className="h-full" />;
	}

	const filtered = applyConfigFilters(current.diagramData, current.config);
	const { html } = generateDiagramHtml(filtered, current.name, current.config);
	const stale = current.status !== 'generating' && (await isViewStale(current));

	return (
		<div className="flex h-full flex-col">
			{current.status === 'generating' ? <RegeneratingBanner /> : stale && <StaleBanner viewId={current.id} />}
			<div className="min-h-0 flex-1">
				<DiagramFrame
					html={html}
					viewId={current.id}
					repoFullName={current.repoFullName}
					branch={current.branch}
				/>
			</div>
		</div>
	);
}
