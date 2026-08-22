// Throwaway data-extraction script for the layer-diagram mockup. Does NOT
// modify any package - just imports the already-built @kratai/core and
// @kratai/diagram-view output as a library to pull real data out of kratai's
// own packages/core folder.
const path = require('path');
const fs = require('fs');

const corePath = '/Users/nightrabbit/Documents/GitHub/kratai/packages/core/out';
const { CodeParserService, DiagramGeneratorService, ConfigService, FolderStructureBuilder } = require(corePath);

// Same dictionary as packages/diagram-view/src/components/folderBoxRenderer.ts
// (copied, not imported - it's private to that module) so the mockup's slab
// stacking order matches what the real renderer would already produce.
const LAYER_WEIGHTS = {
	"api": 100, "apis": 100, "get": 100, "post": 100, "put": 100, "patch": 100, "delete": 100,
	"head": 100, "options": 100, "websocket": 100, "ws": 100, "webhook": 100, "webhooks": 100,
	"endpoints": 105, "endpoint": 105, "graphql": 110, "mutation": 110, "subscription": 110,
	"middleware": 200, "middlewares": 200, "interceptors": 205, "interceptor": 205,
	"guards": 210, "guard": 210, "filters": 215, "filter": 215,
	"routes": 300, "route": 300, "routing": 300, "urls": 305, "url": 305,
	"controllers": 400, "controller": 400, "handlers": 405, "handler": 405,
	"views": 400, "view": 400, "pages": 400, "page": 400, "screens": 400, "screen": 400,
	"services": 750, "service": 750, "usecases": 505, "use-cases": 505, "usecase": 505,
	"business": 510, "domain": 515, "domains": 515, "core": 520,
	"providers": 520, "provider": 520, "store": 520, "stores": 520,
	"commands": 525, "command": 525, "actions": 525, "action": 525,
	"reducers": 528, "reducer": 528, "queries": 530, "query": 530,
	"processors": 535, "processor": 535, "workflows": 540, "workflow": 540,
	"config": 600, "configuration": 600, "settings": 605,
	"utils": 610, "util": 610, "utilities": 610, "helpers": 615, "helper": 615,
	"hooks": 618, "hook": 618, "common": 620, "shared": 625, "lib": 760, "libs": 760, "library": 760,
	"interfaces": 640, "interface": 640,
	"constants": 645, "constant": 645, "enums": 650, "enum": 650,
	"adapters": 655, "adapter": 655, "clients": 660, "client": 660,
	"external": 665, "integrations": 670, "integration": 670,
	"features": 675, "feature": 675, "modules": 680, "module": 680,
	// Data Access (770-799) and "types" (810, folded into Data Structures) -
	// shifted above services/lib's 750/760 bump so this tier still sorts
	// after business logic, matching the tier system's original 500s<600s<
	// 700s<800s intent (the earlier services/lib bump broke that ordering
	// for this tier until now).
	"repositories": 770, "repository": 770, "repos": 770, "repo": 770,
	"dal": 775, "dataaccess": 775, "data-access": 775, "persistence": 780,
	"models": 800, "model": 800, "dto": 805, "dtos": 805, "entities": 805, "entity": 805,
	"schemas": 808, "schema": 808, "types": 810, "type": 810, "database": 815, "db": 815, "storage": 818, "data": 820,
	"templates": 900, "template": 900, "layouts": 900, "layout": 900,
	"presenters": 905, "presenter": 905, "serializers": 910, "serializer": 910,
	"responses": 915, "response": 915, "formatters": 920, "formatter": 920,
	"components": 925, "component": 925, "ui": 925,
	"tests": 990, "test": 990, "__tests__": 990, "specs": 992, "spec": 992,
	"__specs__": 992, "e2e": 994, "unit": 996, "docs": 998, "documentation": 998,
	"examples": 999, "example": 999
};

function layerWeightFor(folderPath) {
	const tokens = folderPath.toLowerCase().split(/[\/\s_-]+/);
	let best = 9999;
	for (const t of tokens) {
		if (LAYER_WEIGHTS[t] !== undefined) best = Math.min(best, LAYER_WEIGHTS[t]);
	}
	return best;
}

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

	// Drop synthetic "virtual API route" pseudo-classes (id starts with a
	// route: pseudo-path) - these duplicate the real per-file route handlers
	// already present in app/api/**, and clutter an unclassified root bucket.
	leaves.forEach(f => { f.classes = f.classes.filter(n => !n.id.startsWith('route:')); });
	const nonEmptyLeaves = leaves.filter(f => f.classes.length > 0);

	const folders = nonEmptyLeaves.map(f => ({
		path: f.fullPath,
		name: f.name,
		layerWeight: layerWeightFor(f.fullPath),
		classes: f.classes.map(n => ({
			id: n.id,
			name: n.data.classInfo.name,
			isInterface: !!n.data.classInfo.isInterface,
			isAbstract: !!n.data.classInfo.isAbstract,
			methodCount: (n.data.classInfo.methods || []).length,
			propertyCount: (n.data.classInfo.properties || []).length
		}))
	})).sort((a, b) => a.layerWeight - b.layerWeight);

	const classIdToFolder = {};
	folders.forEach(f => f.classes.forEach(c => { classIdToFolder[c.id] = f.path; }));

	const relationships = edges
		.map(e => ({
			source: e.source,
			target: e.target,
			type: Array.isArray(e.label) ? e.label[0] : (e.label || 'uses'),
			sourceFolder: classIdToFolder[e.source],
			targetFolder: classIdToFolder[e.target]
		}))
		.filter(r => r.sourceFolder && r.targetFolder);

	const output = { workspaceName: 'nextjs-layered-app', folders, relationships };
	fs.writeFileSync(__dirname + '/mockup-data.json', JSON.stringify(output, null, 2));
	console.log(`Extracted ${folders.length} folders, ${folders.reduce((s, f) => s + f.classes.length, 0)} classes, ${relationships.length} cross-referenced relationships`);
	folders.forEach(f => console.log(`  [${f.layerWeight}] ${f.path} (${f.classes.length} classes)`));
}

main().catch(e => { console.error(e); process.exit(1); });
