'use client';

import type { ConfigFolderNode, KrataiConfig } from '@kratai/core';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { createViewAction, updateViewAction } from '@/lib/data/actions';
import type { FilterOption } from '@/lib/diagram/generateDiagramHtml';
import { getRelTypeDescription, getRelTypeLabel, getTypeLabel } from '@/lib/diagram/labels';

import { ExtensionPicker } from './ExtensionPicker';
import { FolderTree } from './FolderTree';
import { TypeFilterList } from './TypeFilterList';

function initialFolderSelection(node: ConfigFolderNode, acc: Record<string, boolean> = {}) {
	if (node.path) acc[node.path] = node.selected;
	node.children.forEach((child) => initialFolderSelection(child, acc));
	return acc;
}

/** Minimal set of folder paths to store: skip a path if an ancestor is
 * already included (WorkspaceScanner recurses into subdirectories of any
 * selected folder, so listing both is redundant). If nothing was
 * deselected, `[]` means "everything" - the config's own default. */
function computeSelectedFolders(tree: ConfigFolderNode, selection: Record<string, boolean>): string[] {
	const allSelected = Object.values(selection).every((v) => v !== false);
	if (allSelected) return [];

	const result: string[] = [];
	function walk(node: ConfigFolderNode, ancestorIncluded: boolean) {
		const included = node.path === '' ? true : (selection[node.path] ?? true);
		if (node.path && included && !ancestorIncluded) {
			result.push(node.path);
		}
		node.children.forEach((child) => walk(child, ancestorIncluded || included));
	}
	walk(tree, false);
	return result;
}

interface ConfigFormProps {
	mode: 'create' | 'edit';
	viewId?: string;
	repoFullName: string;
	branch: string;
	initialName: string;
	initialConfig: KrataiConfig;
	folderTree: ConfigFolderNode;
	extensionOptions: FilterOption[];
	classTypeOptions: FilterOption[];
	relationshipTypeOptions: FilterOption[];
}

export function ConfigForm({
	mode,
	viewId,
	repoFullName,
	branch,
	initialName,
	initialConfig,
	folderTree,
	extensionOptions,
	classTypeOptions,
	relationshipTypeOptions,
}: ConfigFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const [name, setName] = useState(initialName);
	const [selectedExtensions, setSelectedExtensions] = useState(initialConfig.selectedExtensions);
	const [folderSelection, setFolderSelection] = useState<Record<string, boolean>>(() =>
		initialFolderSelection(folderTree)
	);
	const [classTypeFilters, setClassTypeFilters] = useState<Record<string, boolean>>(
		initialConfig.classTypeFilters ?? {}
	);
	const [relationshipTypeFilters, setRelationshipTypeFilters] = useState<Record<string, boolean>>(
		initialConfig.relationshipTypeFilters ?? {}
	);
	const [detectHttpCalls, setDetectHttpCalls] = useState(initialConfig.detectHttpCalls !== false);
	const [frameworkEnrichment, setFrameworkEnrichment] = useState(
		initialConfig.frameworkEnrichment !== false
	);

	const selectedFolderCount = useMemo(
		() => Object.values(folderSelection).filter((v) => v !== false).length,
		[folderSelection]
	);

	function handleFolderToggle(paths: string[], value: boolean) {
		setFolderSelection((prev) => {
			const next = { ...prev };
			paths.forEach((p) => (next[p] = value));
			return next;
		});
	}

	function handleSubmit() {
		const config: KrataiConfig = {
			selectedFolders: computeSelectedFolders(folderTree, folderSelection),
			selectedExtensions,
			respectGitignore: true,
			classTypeFilters,
			relationshipTypeFilters,
			detectHttpCalls,
			frameworkEnrichment,
		};

		startTransition(async () => {
			if (mode === 'edit' && viewId) {
				await updateViewAction(viewId, { name, config });
				router.push(`/diagrams/${viewId}`);
			} else {
				const view = await createViewAction({ repoFullName, branch, name, config });
				router.push(`/diagrams/${view.id}`);
			}
		});
	}

	return (
		<div className="flex flex-col gap-10">
			<section>
				<label className="mb-2 block text-sm font-semibold tracking-wide text-ink-3 uppercase">
					Diagram name
				</label>
				<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Backend services" />
			</section>

			<section>
				<h2 className="mb-3 text-sm font-semibold tracking-wide text-ink-3 uppercase">
					Folders ({selectedFolderCount} selected)
				</h2>
				<div className="max-h-72 overflow-y-auto rounded-md border border-line bg-surface-2 p-3">
					<FolderTree node={folderTree} selected={folderSelection} onToggle={handleFolderToggle} />
				</div>
			</section>

			<section>
				<h2 className="mb-3 text-sm font-semibold tracking-wide text-ink-3 uppercase">File extensions</h2>
				<ExtensionPicker
					options={extensionOptions}
					selected={selectedExtensions}
					onChange={setSelectedExtensions}
				/>
			</section>

			<section>
				<h2 className="mb-3 text-sm font-semibold tracking-wide text-ink-3 uppercase">Class types</h2>
				<TypeFilterList
					options={classTypeOptions}
					filters={classTypeFilters}
					onChange={setClassTypeFilters}
					getLabel={getTypeLabel}
				/>
			</section>

			<section>
				<h2 className="mb-3 text-sm font-semibold tracking-wide text-ink-3 uppercase">Relationship types</h2>
				<TypeFilterList
					options={relationshipTypeOptions}
					filters={relationshipTypeFilters}
					onChange={setRelationshipTypeFilters}
					getLabel={getRelTypeLabel}
					getDescription={getRelTypeDescription}
				/>
			</section>

			<section className="flex flex-col gap-4">
				<h2 className="text-sm font-semibold tracking-wide text-ink-3 uppercase">Analysis options</h2>
				<label className="flex items-center justify-between rounded-md border border-line bg-panel px-4 py-3">
					<span className="text-sm text-ink-2">
						Detect HTTP calls
						<span className="block text-xs text-ink-3">fetch/axios calls to API endpoints</span>
					</span>
					<Switch checked={detectHttpCalls} onCheckedChange={setDetectHttpCalls} />
				</label>
				<label className="flex items-center justify-between rounded-md border border-line bg-panel px-4 py-3">
					<span className="text-sm text-ink-2">
						Framework enrichment
						<span className="block text-xs text-ink-3">
							Django/Next.js/Spring Boot-specific relationships
						</span>
					</span>
					<Switch checked={frameworkEnrichment} onCheckedChange={setFrameworkEnrichment} />
				</label>
			</section>

			<div className="flex justify-end gap-3 border-t border-line pt-6">
				<Button variant="secondary" onClick={() => router.back()}>
					Cancel
				</Button>
				<Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
					{isPending ? 'Generating...' : mode === 'edit' ? 'Save & regenerate' : 'Generate diagram'}
				</Button>
			</div>
		</div>
	);
}
