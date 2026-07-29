import { MarkdownExporter } from '@kratai/core';
import { NextResponse } from 'next/server';

import { getView } from '@/lib/data';
import { applyConfigFilters, getFixtureDiagramData } from '@/lib/diagram/generateDiagramHtml';

export async function GET(_request: Request, { params }: { params: Promise<{ viewId: string }> }) {
	const { viewId } = await params;
	const view = await getView(viewId);
	if (!view) {
		return NextResponse.json({ error: 'Diagram view not found' }, { status: 404 });
	}

	// Same fixture-backed data path the diagram viewer page uses - phase 2
	// replaces getFixtureDiagramData() with a real server-side clone + parse,
	// everything else in this handler stays the same.
	const filtered = applyConfigFilters(getFixtureDiagramData(), view.config);
	const markdown = MarkdownExporter.toMarkdown(filtered, view.name);

	const fileName = `${view.name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.md`;

	return new NextResponse(markdown, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Content-Disposition': `attachment; filename="${fileName}"`,
		},
	});
}
