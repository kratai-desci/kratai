import { notFound } from 'next/navigation';

import { DEFAULT_CONFIG } from '@/1_application/config';
import {
	buildFolderTree,
	getAvailableClassTypes,
	getAvailableExtensions,
	getAvailableRelationshipTypes,
	listRepoFiles,
	type FilterOption,
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
	let cachedDiagramData: NonNullable<Awaited<ReturnType<typeof getView>>>['diagramData'];

	if (mode === 'edit') {
		const view = await getView(params.viewId!);
		if (!view) notFound();
		repoFullName = view.repoFullName;
		branch = view.branch;
		initialName = view.name;
		initialConfig = view.config;
		viewId = view.id;
		cachedDiagramData = view.diagramData;
	} else {
		if (!params.repo || !params.branch) notFound();
		repoFullName = params.repo;
		branch = params.branch;
		initialName = `${repoFullName.split('/')[1]} diagram`;
	}

	// Editing an already-generated view: reuse its cached parse for real
	// class-type/relationship-type filter options instead of re-cloning.
	// Otherwise (a brand-new diagram, or editing a view that's never
	// successfully generated) there's no parsed data to draw options from
	// yet - fall back to a cheap file-listing scan (no parsing) just to
	// build the folder tree/extension picker, and leave the type filters
	// empty until the first real generation produces something to filter.
	let files: string[];
	let classTypeOptions: FilterOption[] = [];
	let relationshipTypeOptions: FilterOption[] = [];

	if (cachedDiagramData) {
		files = [...new Set(cachedDiagramData.classes.map((c) => c.filePath))];
		classTypeOptions = getAvailableClassTypes(cachedDiagramData);
		relationshipTypeOptions = getAvailableRelationshipTypes(cachedDiagramData);
	} else {
		files = await listRepoFiles(repoFullName, branch, initialConfig);
	}

	const folderTree = buildFolderTree(files, initialConfig);
	const extensionOptions = getAvailableExtensions(files);

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
