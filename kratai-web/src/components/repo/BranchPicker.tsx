'use client';

import { Check, GitBranch, Loader2 } from 'lucide-react';

import type { Branch } from '@/2_domain';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function BranchPicker({
	branches,
	selected,
	onSelect,
	isLoading,
}: {
	branches: Branch[];
	selected: string | null;
	onSelect: (branch: string) => void;
	isLoading?: boolean;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="secondary">
					{isLoading ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<GitBranch className="size-4" />
					)}
					{selected ?? 'Select branch'}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				{isLoading && branches.length === 0 && (
					<div className="px-2 py-1.5 text-sm text-ink-3">Loading branches...</div>
				)}
				{branches.map((branch) => (
					<DropdownMenuItem key={branch.name} onSelect={() => onSelect(branch.name)}>
						{branch.name === selected && <Check className="size-3.5 text-brand-ink" />}
						{branch.name}
						{branch.isDefault && <span className="ml-auto text-xs text-ink-3">default</span>}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
