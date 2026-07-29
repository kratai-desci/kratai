// Copied from apps/vsextension/src/commands/showConfigPanel.ts's
// getTypeLabel/getRelTypeLabel/getRelTypeDescription so the config panel
// reads identically across the extension and the web app. Pure string
// maps - safe to import from both Server and Client Components.

export function getTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		class: '📦 Classes',
		interface: '🔌 Interfaces',
		abstract: '🎨 Abstract Classes',
		module: '📄 Modules',
		enum: '🔢 Enums',
	};
	return labels[type] || `📋 ${type.charAt(0).toUpperCase() + type.slice(1)}`;
}

export function getRelTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		extends: '🔵 Extends',
		implements: '🟣 Implements',
		composition: '🔴 Composition',
		uses: '⚪ Uses',
		calls: '📞 Calls',
		'calls-super': '⬆️ Calls Super',
		'calls-static': '🔷 Calls Static',
		'async-calls': '⚡ Async Calls',
		parameter: '📝 Parameter',
		returns: '↩️ Returns',
		creates: '🏭 Creates',
		imports: '📦 Imports',
		're-exports': '🔄 Re-exports',
		'http-call': '📡 HTTP Call',
		'routes-to': '🔗 Routes To',
		'belongs-to': '🗄️ Belongs To',
		'many-to-many': '🔗 Many-to-Many',
		'one-to-one': '⚡ One-to-One',
		renders: '🎨 Renders',
		serializes: '📦 Serializes',
		'protected-by': '🛡️ Protected By',
		middleware: '🔐 Middleware',
		'layout-wraps': '🧱 Layout Wraps',
		'server-action': '⚡ Server Action',
		generic: '🧬 Generic',
	};
	return labels[type] || `🔗 ${type.charAt(0).toUpperCase() + type.slice(1)}`;
}

export function getRelTypeDescription(type: string): string {
	const descriptions: Record<string, string> = {
		extends: 'Class inheritance',
		implements: 'Interface implementation',
		composition: 'Property type relationships',
		uses: 'Dependencies and imports',
		calls: 'Method/function calls',
		'calls-super': 'super() method calls',
		'calls-static': 'Static method calls',
		'async-calls': 'Async function calls',
		parameter: 'Function parameter types',
		returns: 'Function return types',
		creates: 'Object creation (new)',
		imports: 'Module imports',
		're-exports': 'Module re-exports',
		'http-call': 'fetch() calls to API endpoints',
		'routes-to': 'URL pattern → Handler',
		'belongs-to': 'ForeignKey, one-to-many',
		'many-to-many': 'M2M field relationships',
		'one-to-one': '1-to-1 field relationships',
		renders: 'View → Template',
		serializes: 'DRF Serializer → Model',
		'protected-by': 'Middleware → Protected route',
		middleware: 'Next.js middleware protection',
		'layout-wraps': 'Next.js layout → Nested page',
		'server-action': 'Next.js form → Server action',
		generic: 'Generic type parameter usage',
	};
	return descriptions[type] || '';
}
