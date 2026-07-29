'use client';

import { Check, GitBranch } from 'lucide-react';

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
}: {
	branches: Branch[];
	selected: string | null;
	onSelect: (branch: string) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="secondary">
					<GitBranch className="size-4" />
					{selected ?? 'Select branch'}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
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
