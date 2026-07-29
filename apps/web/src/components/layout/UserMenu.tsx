'use client';

import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/lib/data/types';

export function UserMenu({ user }: { user: User }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
				<Avatar name={user.name} src={user.avatarUrl} size={28} />
				<ChevronDown className="size-3.5 text-ink-3" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-[14rem]">
				<DropdownMenuLabel className="flex flex-col gap-0.5 normal-case">
					<span className="text-sm font-medium text-ink">{user.name}</span>
					<span className="text-xs text-ink-3">@{user.username}</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/profile">
						<UserIcon className="size-3.5" />
						Profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild className="text-danger-2 data-[highlighted]:text-danger-2">
					<Link href="/">
						<LogOut className="size-3.5" />
						Sign out
					</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
