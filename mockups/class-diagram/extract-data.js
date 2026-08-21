// Throwaway extraction for the 2D-diagram redesign mockup - full class detail
// this time (methods/properties/visibility), not just counts. Same
// no-source-touched approach as the layer-stack mock's extraction script.
const fs = require('fs');
const corePath = '/Users/nightrabbit/Documents/GitHub/kratai/packages/core/out';
const { CodeParserService, DiagramGeneratorService, ConfigService, FolderStructureBuilder } = require(corePath);

function collectLeafFolders(folder, leaves) {
	if (folder.classes.length > 0) leaves.push(folder);
	for (const child of folder.children.values()) collectLeafFolders(child, leaves);
}

async function main() {
	const targetPath = '/Users/nightrabbit/Desktop/Sample projects/nextjs-layered-app';
	const config = ConfigService.generateSmartDefaults(targetPath);
	const diagramData = await CodeParserService.parseWorkspace(targetPath, config);
	const { nodes, edges } = DiagramGeneratorService.generateReactFlowData(diagramData);

	const root = FolderStructureBuilder.build(nodes);
	const leaves = [];
	collectLeafFolders(root, leaves);

	const folders = leaves.map(f => ({
		path: f.fullPath,
		name: f.name,
		classes: f.classes.map(n => {
			const ci = n.data.classInfo;
			return {
				id: n.id,
				name: ci.name,
				isInterface: !!ci.isInterface,
				isAbstract: !!ci.isAbstract,
				filePath: ci.filePath,
				changeStatus: ci.changeStatus || 'unchanged',
				properties: (ci.properties || []).map(p => ({
					name: p.name, type: p.type, visibility: p.visibility
				})),
				methods: (ci.methods || []).map(m => ({
					name: m.name, visibility: m.visibility,
					params: (m.parameters || []).map(p => p.name)
				}))
			};
		})
	}));

	// Drop synthetic "virtual API route" pseudo-classes (id starts with a
	// route: pseudo-path) - core's own HTTP-route detector picks up literal
	// route strings inside its own test/detection code when run on itself,
	// which isn't a real class and clutters a first look at the mockup.
	folders.forEach(f => { f.classes = f.classes.filter(c => !c.id.startsWith('route:')); });
	const trimmed = folders.filter(f => f.classes.length > 0);

	const edgesOut = edges.map(e => ({
		source: e.source, target: e.target,
		type: Array.isArray(e.label) ? e.label[0] : (e.label || 'uses')
	})).filter(e => {
		const idsInFolders = new Set(trimmed.flatMap(f => f.classes.map(c => c.id)));
		return idsInFolders.has(e.source) && idsInFolders.has(e.target);
	});

	const output = { workspaceName: 'nextjs-layered-app', folders: trimmed, relationships: edgesOut };
	fs.writeFileSync(__dirname + '/mockup-2d-data.json', JSON.stringify(output, null, 2));
	console.log(`Extracted ${trimmed.length} folders, ${trimmed.reduce((s, f) => s + f.classes.length, 0)} classes, ${edgesOut.length} relationships`);
}

main().catch(e => { console.error(e); process.exit(1); });
