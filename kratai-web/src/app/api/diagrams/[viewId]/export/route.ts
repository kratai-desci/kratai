import { MarkdownExporter } from '@kratai/core';
import { NextResponse } from 'next/server';

import { applyConfigFilters, getDiagramData } from '@/1_application/diagram';
import { getView } from '@/1_application/queries';

export async function GET(_request: Request, { params }: { params: Promise<{ viewId: string }> }) {
	const { viewId } = await params;
	const view = await getView(viewId);
	if (!view) {
		return NextResponse.json({ error: 'Diagram view not found' }, { status: 404 });
	}

	// Reuse the cached parse the viewer page already generated, instead of
	// re-cloning just to export - falls back to a fresh clone+parse only if
	// this view has never successfully generated yet.
	const data = view.diagramData ?? (await getDiagramData(view.repoFullName, view.branch, view.config));
	const filtered = applyConfigFilters(data, view.config);
	const markdown = MarkdownExporter.toMarkdown(filtered, view.name);

	const fileName = `${view.name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.md`;

	return new NextResponse(markdown, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Content-Disposition': `attachment; filename="${fileName}"`,
		},
	});
}
