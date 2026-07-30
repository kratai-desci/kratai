'use client';

import { ChevronDown, Download, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

import { signOutAction } from '@/1_application/authActions';
import type { User } from '@/2_domain';
import { Avatar } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
				<DropdownMenuItem asChild>
					<Link href="/download">
						<Download className="size-3.5" />
						Download
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-danger-2 data-[highlighted]:text-danger-2"
					onSelect={() => {
						void signOutAction();
					}}
				>
					<LogOut className="size-3.5" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
