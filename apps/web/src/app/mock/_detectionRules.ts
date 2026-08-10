'use client';

import { useState } from 'react';

// Shared detection-rule data + state logic for the /mock tree. Used by both
// the onboarding flow (set defaults while connecting a repo) and the
// per-repo settings page (adjust later), so the two stay in sync instead of
// drifting into two separate rule lists.
export type Severity = 'info' | 'warning' | 'error';
export type Category = 'general' | 'pattern';

export interface DetectionRule {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	severity: Severity;
	category: Category;
}

// No detection engine exists yet - this is UI-only to visualize the scope
// of what PR review could cover, so it intentionally goes beyond what the
// current static-analysis parser can already do (see ClassInfo/MethodInfo/
// ClassRelationship in packages/core - there's no method-body/AST data
// today, only signatures + class-level relationships). "General" are
// architecture/code-health checks; "Design patterns" flag where a known
// pattern is used, missing, or could simplify the change - awareness for
// the reviewer, not a strict violation, so most default to Info rather
// than Warning/Error.
export const DEFAULT_RULES: DetectionRule[] = [
	// General principles
	{
		id: 'bloated-controller',
		name: 'Bloated controller',
		description:
			'A class mixing multiple responsibilities (e.g. I/O and orchestration) grows past a healthy size.',
		enabled: true,
		severity: 'warning',
		category: 'general',
	},
	{
		id: 'circular-dependency',
		name: 'Circular dependency',
		description: 'A new import cycle is introduced between modules.',
		enabled: true,
		severity: 'error',
		category: 'general',
	},
	{
		id: 'layer-violation',
		name: 'Layer violation',
		description: 'UI or domain code imports infrastructure directly, bypassing the application layer.',
		enabled: true,
		severity: 'error',
		category: 'general',
	},
	{
		id: 'encapsulation',
		name: 'Encapsulation violation',
		description: 'A class exposes mutable public fields instead of controlled accessors.',
		enabled: true,
		severity: 'warning',
		category: 'general',
	},
	{
		id: 'code-duplication',
		name: 'Code duplication',
		description: 'Near-duplicate logic is added instead of reusing an existing implementation.',
		enabled: true,
		severity: 'warning',
		category: 'general',
	},
	{
		id: 'orphaned-code',
		name: 'Orphaned code',
		description: 'An exported class or function is left with no remaining references after this change.',
		enabled: false,
		severity: 'info',
		category: 'general',
	},
	{
		id: 'unnecessary-abstraction',
		name: 'Unnecessary abstraction',
		description: 'An interface or abstract class has only one implementation, adding indirection without payoff.',
		enabled: false,
		severity: 'info',
		category: 'general',
	},
	{
		id: 'inconsistent-structure',
		name: 'Inconsistent structure',
		description: "A new file doesn't follow the repo's established folder conventions.",
		enabled: false,
		severity: 'info',
		category: 'general',
	},

	// Design pattern usage
	{
		id: 'singleton',
		name: 'Singleton',
		description: 'A new or modified singleton (private constructor + static instance) is introduced.',
		enabled: true,
		severity: 'info',
		category: 'pattern',
	},
	{
		id: 'strategy-polymorphism',
		name: 'Strategy / polymorphism',
		description: 'Branching on a type field (if/switch) could be replaced with polymorphism or a strategy.',
		enabled: true,
		severity: 'warning',
		category: 'pattern',
	},
	{
		id: 'dependency-injection',
		name: 'Dependency injection',
		description: 'A class constructs its own dependencies instead of receiving them, hurting testability.',
		enabled: true,
		severity: 'warning',
		category: 'pattern',
	},
	{
		id: 'factory',
		name: 'Factory',
		description: 'Object-creation logic is scattered across call sites instead of centralized in a factory.',
		enabled: false,
		severity: 'info',
		category: 'pattern',
	},
	{
		id: 'observer',
		name: 'Observer',
		description: 'Manual pub/sub or callback wiring could use an observer pattern instead.',
		enabled: false,
		severity: 'info',
		category: 'pattern',
	},
	{
		id: 'decorator',
		name: 'Decorator',
		description: 'A wrapper-class explosion could be replaced by composing behavior with a decorator.',
		enabled: false,
		severity: 'info',
		category: 'pattern',
	},
	{
		id: 'adapter',
		name: 'Adapter',
		description: 'Ad-hoc translation logic between two interfaces could be formalized as an adapter.',
		enabled: false,
		severity: 'info',
		category: 'pattern',
	},
	{
		id: 'builder',
		name: 'Builder',
		description: 'A constructor with many optional parameters could be simplified with a builder.',
		enabled: false,
		severity: 'info',
		category: 'pattern',
	},
];

export const SEVERITIES: Severity[] = ['info', 'warning', 'error'];

export const SEVERITY_LABEL: Record<Severity, string> = { info: 'Info', warning: 'Warning', error: 'Error' };
export const SEVERITY_BADGE_VARIANT: Record<Severity, 'neutral' | 'warning' | 'danger'> = {
	info: 'neutral',
	warning: 'warning',
	error: 'danger',
};

export function useDetectionRules() {
	const [rules, setRules] = useState<DetectionRule[]>(DEFAULT_RULES);

	function toggleRule(id: string) {
		setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
	}

	function setSeverity(id: string, severity: Severity) {
		setRules((prev) => prev.map((r) => (r.id === id ? { ...r, severity } : r)));
	}

	return { rules, toggleRule, setSeverity };
}
