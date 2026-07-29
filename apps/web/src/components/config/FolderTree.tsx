'use client';

import type { ConfigFolderNode } from '@kratai/core';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';

function collectPaths(node: ConfigFolderNode): string[] {
	const paths: string[] = [];
	(function walk(n: ConfigFolderNode) {
		if (n.path) paths.push(n.path);
		n.children.forEach(walk);
	})(node);
	return paths;
}

export function FolderTree({
	node,
	selected,
	onToggle,
	depth = 0,
}: {
	node: ConfigFolderNode;
	selected: Record<string, boolean>;
	onToggle: (paths: string[], value: boolean) => void;
	depth?: number;
}) {
	const [expanded, setExpanded] = useState(true);
	const isChecked = node.path === '' ? true : (selected[node.path] ?? true);
	const hasChildren = node.children.length > 0;

	return (
		<div>
			<div className="flex items-center gap-2 py-1" style={{ paddingLeft: depth * 18 }}>
				{hasChildren ? (
					<button
						type="button"
						onClick={() => setExpanded((e) => !e)}
						className="text-ink-3 hover:text-ink"
						aria-label={expanded ? 'Collapse' : 'Expand'}
					>
						{expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
					</button>
				) : (
					<span className="inline-block w-3.5" />
				)}
				{node.path !== '' ? (
					<Checkbox
						checked={isChecked}
						onCheckedChange={(value) => onToggle(collectPaths(node), value === true)}
					/>
				) : (
					<span className="inline-block w-4" />
				)}
				<Folder className="size-3.5 text-ink-3" />
				<span className="text-sm text-ink-2">{node.name}</span>
				{!!node.fileCount && <span className="text-xs text-ink-3">({node.fileCount})</span>}
			</div>
			{expanded && hasChildren && (
				<div>
					{node.children.map((child) => (
						<FolderTree
							key={child.path}
							node={child}
							selected={selected}
							onToggle={onToggle}
							depth={depth + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}
