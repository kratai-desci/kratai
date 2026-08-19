import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { SEVERITIES, SEVERITY_BADGE_VARIANT, SEVERITY_LABEL } from '@/app/mock/_detectionRules';
import type { DetectionRule, Severity } from '@/app/mock/_detectionRules';

export function RuleCard({
	rule,
	onToggle,
	onSeverityChange,
}: {
	rule: DetectionRule;
	onToggle: (id: string) => void;
	onSeverityChange: (id: string, severity: Severity) => void;
}) {
	return (
		<div
			className={cn(
				'flex items-start gap-4 rounded-lg border px-4 py-3 transition-colors',
				rule.enabled ? 'border-line bg-panel' : 'border-line bg-panel opacity-60'
			)}
		>
			<Switch
				checked={rule.enabled}
				onCheckedChange={() => onToggle(rule.id)}
				className="mt-0.5"
				aria-label={`Toggle ${rule.name}`}
			/>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="font-medium text-ink">{rule.name}</span>
					<Badge variant={SEVERITY_BADGE_VARIANT[rule.severity]}>{SEVERITY_LABEL[rule.severity]}</Badge>
				</div>
				<p className="mt-0.5 text-sm text-ink-2">{rule.description}</p>
			</div>

			<div className="flex shrink-0 items-center gap-1 rounded-md border border-line p-0.5">
				{SEVERITIES.map((severity) => (
					<button
						key={severity}
						type="button"
						disabled={!rule.enabled}
						onClick={() => onSeverityChange(rule.id, severity)}
						className={cn(
							'rounded px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
							rule.severity === severity ? 'bg-brand text-on-brand' : 'text-ink-3 hover:text-ink'
						)}
					>
						{SEVERITY_LABEL[severity]}
					</button>
				))}
			</div>
		</div>
	);
}
