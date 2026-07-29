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

	// Same data path the diagram viewer page uses - real repo clone+parse
	// when signed in, the mock fixture otherwise (see
	// 3_infrastructure/diagramSource.ts).
	const data = await getDiagramData(view.repoFullName, view.branch, view.config);
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
