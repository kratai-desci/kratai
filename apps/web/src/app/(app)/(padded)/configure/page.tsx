import { notFound } from 'next/navigation';

import { DEFAULT_CONFIG } from '@/1_application/config';
import {
	buildFolderTree,
	getAvailableClassTypes,
	getAvailableExtensions,
	getAvailableRelationshipTypes,
	getDiagramData,
} from '@/1_application/diagram';
import { getView } from '@/1_application/queries';
import { ConfigForm } from '@/components/config/ConfigForm';

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

	const data = await getDiagramData(repoFullName, branch, initialConfig);
	const folderTree = buildFolderTree(data, initialConfig);
	const extensionOptions = getAvailableExtensions(data);
	const classTypeOptions = getAvailableClassTypes(data);
	const relationshipTypeOptions = getAvailableRelationshipTypes(data);

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
