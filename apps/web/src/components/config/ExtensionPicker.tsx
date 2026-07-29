'use client';

import { Checkbox } from '@/components/ui/checkbox';
import type { FilterOption } from '@/lib/diagram/generateDiagramHtml';

export function ExtensionPicker({
	options,
	selected,
	onChange,
}: {
	options: FilterOption[];
	selected: string[];
	onChange: (extensions: string[]) => void;
}) {
	function toggle(ext: string, checked: boolean) {
		onChange(checked ? [...selected, ext] : selected.filter((e) => e !== ext));
	}

	return (
		<div className="flex flex-wrap gap-3">
			{options.map(({ type: ext, count }) => (
				<label
					key={ext}
					className="flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-ink-2"
				>
					<Checkbox
						checked={selected.includes(ext)}
						onCheckedChange={(value) => toggle(ext, value === true)}
						disabled={count === 0}
					/>
					<span className={count === 0 ? 'text-ink-3' : undefined}>{ext}</span>
					<span className="text-xs text-ink-3">({count})</span>
				</label>
			))}
		</div>
	);
}
