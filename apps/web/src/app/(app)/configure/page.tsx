import { notFound } from 'next/navigation';

import { ConfigForm } from '@/components/config/ConfigForm';
import { DEFAULT_CONFIG, getView } from '@/lib/data';
import {
	buildFixtureFolderTree,
	getAvailableClassTypes,
	getAvailableExtensions,
	getAvailableRelationshipTypes,
	getFixtureDiagramData,
} from '@/lib/diagram/generateDiagramHtml';

interface ConfigurePageProps {
	searchParams: Promise<{ repo?: string; branch?: string; viewId?: string }>;
}

export default async function ConfigurePage({ searchParams }: ConfigurePageProps) {
	const params = await searchParams;

	const mode: 'create' | 'edit' = params.viewId ? 'edit' : 'create';

	let repoFullName: string;
	let branch: string;
	let initialName: string;
	let initialConfig = DEFAULT_CONFIG;
	let viewId: string | undefined;

	if (mode === 'edit') {
		const view = await getView(params.viewId!);
		if (!view) notFound();
		repoFullName = view.repoFullName;
		branch = view.branch;
		initialName = view.name;
		initialConfig = view.config;
		viewId = view.id;
	} else {
		if (!params.repo || !params.branch) notFound();
		repoFullName = params.repo;
		branch = params.branch;
		initialName = `${repoFullName.split('/')[1]} diagram`;
	}

	const fixture = getFixtureDiagramData();
	const folderTree = buildFixtureFolderTree(initialConfig);
	const extensionOptions = getAvailableExtensions(fixture);
	const classTypeOptions = getAvailableClassTypes(fixture);
	const relationshipTypeOptions = getAvailableRelationshipTypes(fixture);

	return (
		<div className="mx-auto max-w-3xl">
			<div className="mb-8">
				<h1 className="text-3xl font-semibold text-ink">
					{mode === 'edit' ? 'Edit diagram' : 'Configure diagram'}
				</h1>
				<p className="mt-1 text-sm text-ink-2">
					{repoFullName} @ {branch}
				</p>
			</div>

			<ConfigForm
				mode={mode}
				viewId={viewId}
				repoFullName={repoFullName}
				branch={branch}
				initialName={initialName}
				initialConfig={initialConfig}
				folderTree={folderTree}
				extensionOptions={extensionOptions}
				classTypeOptions={classTypeOptions}
				relationshipTypeOptions={relationshipTypeOptions}
			/>
		</div>
	);
}
