'use client';

import type { FilterOption } from '@/1_application/diagram';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export function TypeFilterList({
	options,
	filters,
	onChange,
	getLabel,
	getDescription,
}: {
	options: FilterOption[];
	filters: Record<string, boolean>;
	onChange: (filters: Record<string, boolean>) => void;
	getLabel: (type: string) => string;
	getDescription?: (type: string) => string;
}) {
	function toggle(type: string, checked: boolean) {
		onChange({ ...filters, [type]: checked });
	}

	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
			{options.map(({ type, count }) => {
				const checked = filters[type] !== false;
				const description = getDescription?.(type);
				return (
					<label
						key={type}
						className={cn(
							'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
							checked ? 'border-line bg-panel' : 'border-line/60 bg-surface-2 opacity-60'
						)}
					>
						<Checkbox
							checked={checked}
							onCheckedChange={(value) => toggle(type, value === true)}
							className="mt-0.5"
						/>
						<span className="flex-1">
							<span className="flex items-center justify-between text-ink-2">
								<span>{getLabel(type)}</span>
								<span className="text-xs text-ink-3">{count}</span>
							</span>
							{description && <span className="text-xs text-ink-3">{description}</span>}
						</span>
					</label>
				);
			})}
		</div>
	);
}
