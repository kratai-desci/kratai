import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { KnowledgeGraphData } from './knowledgeGraphData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 3D force-directed dependency graph - a different way of navigating the
 * same classes/relationships the Stack Layer and Class Diagram views
 * render, built for a different job: not "browse the whole architecture"
 * but "start from one class and see what it reaches" - forward from an
 * entry point (trace how a request/action flows through the system), or
 * backward from a changed class (blast radius: what depends on this).
 *
 * Shares Stack Layer's exact 3D language on purpose (same vendored three.js,
 * same turntable-rotation + zoom camera, same lighting) rather than
 * inventing a second 3D style - the two views should feel like the same
 * product, not two different demos bolted together.
 *
 * Clustering: the physics itself is biased so classes in the same folder
 * pull toward each other even when there's no direct edge between them
 * (folderCohesion below) - plain force-directed layout only clusters
 * *connected* classes together, but "closely related" in a codebase is as
 * much about "lives in the same place" as "calls each other directly".
 */
export function generateKnowledgeGraphHTML(data: KnowledgeGraphData): string {
	const threePath = path.join(__dirname, 'vendor', 'three.module.min.js');
	const threeSource = fs.readFileSync(threePath);
	const threeDataUri = 'data:text/javascript;base64,' + threeSource.toString('base64');
	const dataJSON = JSON.stringify(data);

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.workspaceName} - knowledge graph</title>
<script>
	try {
		var krataiTheme = localStorage.getItem('kratai-theme');
		if (krataiTheme) document.documentElement.setAttribute('data-theme', krataiTheme);
	} catch (e) {}
</script>
<style>
	:root {
		--bg: #EEF2FA; --surface: #FFFFFF; --surface-2: #F4F7FD;
		--text: #17203A; --text-dim: #5C6785; --text-faint: #94A0BE;
		--border: #DCE3F2; --accent: #3459E0; --accent-2: #14A6B8;
		--node: #8CA0D6; --node-entry: #14A6B8; --node-added: #34C77B; --node-modified: #E0A93A; --node-deleted: #E05B5B;
		--edge: #94A0BE;
		--dot: color-mix(in srgb, var(--text-faint) 55%, transparent);
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
			--node: #4A5A8C; --node-entry: #4FDCEA; --node-added: #34C77B; --node-modified: #E0A93A; --node-deleted: #E05B5B;
			--edge: #5B6488;
			--dot: color-mix(in srgb, var(--border) 70%, transparent);
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		--node: #4A5A8C; --node-entry: #4FDCEA; --node-added: #34C77B; --node-modified: #E0A93A; --node-deleted: #E05B5B;
		--edge: #5B6488;
		--dot: color-mix(in srgb, var(--border) 70%, transparent);
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
	body { background: var(--bg); color: var(--text); font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif; }
	#stage {
		position: absolute; inset: 0; cursor: grab;
		background-image: radial-gradient(var(--dot) 1px, transparent 1px);
		background-size: 22px 22px;
	}
	#stage.grabbing { cursor: grabbing; }
	#stage canvas { position: absolute; inset: 0; }

	#header {
		position: absolute; top: 0; left: 0; right: 0; padding: 14px 20px;
		display: flex; align-items: baseline; gap: 10px; pointer-events: none;
	}
	#header h1 { margin: 0; font-size: 15px; font-weight: 650; }
	#header .sub { font-size: 12.5px; color: var(--text-dim); font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }

	#hint {
		position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
		font-size: 12px; color: var(--text-faint); font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		pointer-events: none;
	}

	#legend {
		position: absolute; top: 16px; right: 16px; background: var(--surface); border: 1px solid var(--border);
		border-radius: 10px; padding: 10px 14px; font-size: 11.5px; color: var(--text-dim); display: flex; flex-direction: column; gap: 6px;
	}
	#legend .row { display: flex; align-items: center; gap: 7px; }
	#legend .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

	#tooltip {
		position: absolute; display: none; background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
		padding: 8px 11px; font-size: 12px; pointer-events: none; max-width: 320px; box-shadow: 0 6px 20px rgba(0,0,0,0.15);
	}
	#tooltip .name { font-weight: 650; margin-bottom: 2px; }
	#tooltip .folder { color: var(--text-dim); font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 11px; }

	#focus-banner {
		position: absolute; top: 16px; left: 50%; transform: translateX(-50%); display: none;
		background: var(--accent); color: #fff; font-size: 12.5px; font-weight: 600;
		padding: 7px 14px; border-radius: 100px; align-items: center; gap: 10px;
	}
	#focus-banner button {
		border: none; background: rgba(255,255,255,0.25); color: #fff; border-radius: 100px;
		font-size: 11px; padding: 3px 10px; cursor: pointer; font-weight: 650;
	}
</style>
</head>
<body>
	<div id="stage"></div>
	<div id="header">
		<h1>${data.workspaceName}</h1>
		<span class="sub">${data.nodes.length} classes &bull; ${data.edges.length} relationships</span>
	</div>
	<div id="legend">
		<div class="row"><span class="dot" style="background:var(--node-entry)"></span>entry point</div>
		<div class="row"><span class="dot" style="background:var(--node-added)"></span>added</div>
		<div class="row"><span class="dot" style="background:var(--node-modified)"></span>modified</div>
		<div class="row"><span class="dot" style="background:var(--node-deleted)"></span>deleted</div>
	</div>
	<div id="focus-banner"><span id="focus-label"></span><button id="focus-clear">Clear</button></div>
	<div id="tooltip"></div>
	<div id="hint">drag to rotate &bull; scroll to zoom &bull; click a class to trace what it touches</div>

<script type="module">
import * as THREE from '${threeDataUri}';

(function () {
	'use strict';
	var DATA = ${dataJSON};

	function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
	function colorVar(name) { return new THREE.Color(cssVar(name)); }

	// ---- graph model ----
	var byId = {};
	var simNodes = DATA.nodes.map(function (n) {
		var node = {
			id: n.id, name: n.name, folder: n.folder, classType: n.classType,
			changeStatus: n.changeStatus, inDegree: n.inDegree, outDegree: n.outDegree, isEntryPoint: n.isEntryPoint,
			x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400, z: (Math.random() - 0.5) * 400,
			vx: 0, vy: 0, vz: 0
		};
		byId[n.id] = node;
		return node;
	});
	var simEdges = DATA.edges.filter(function (e) { return byId[e.source] && byId[e.target]; });

	// Grouped once, not per-tick - simulationTick recomputes each group's
	// centroid every frame (see below), but group membership itself is fixed.
	var byFolder = {};
	simNodes.forEach(function (n) { (byFolder[n.folder] = byFolder[n.folder] || []).push(n); });
	var folderNames = Object.keys(byFolder);

	var forward = {}, backward = {};
	simEdges.forEach(function (e) {
		(forward[e.source] = forward[e.source] || []).push(e.target);
		(backward[e.target] = backward[e.target] || []).push(e.source);
	});
	function reachableFrom(rootId) {
		var seen = {}; seen[rootId] = true;
		var queue = [rootId];
		while (queue.length) {
			var id = queue.shift();
			(forward[id] || []).concat(backward[id] || []).forEach(function (nextId) {
				if (!seen[nextId]) { seen[nextId] = true; queue.push(nextId); }
			});
		}
		return seen;
	}

	function radiusFor(n) { return 3 + Math.min(7, Math.sqrt(n.inDegree + n.outDegree) * 1.4); }

	// ---- physics: folder-aware repulsion + edge springs + per-folder
	// centroid pull, all in 3D. The first version used uniform repulsion
	// between every pair plus a single shared pull toward the world
	// origin - that combination has one stable equilibrium shape no matter
	// what the graph looks like (a roughly even sphere, everything pushed
	// equally far from a single shared center), which is exactly why
	// folders never read as separate clusters. Fixed two ways: repulsion is
	// weaker between two classes in the *same* folder (so they can sit
	// close) and stronger between different folders (so clusters actually
	// push apart), and each class is pulled toward its own folder's
	// centroid instead of one global center - so every folder gets its own
	// gravity well rather than all of them competing for the same one.
	// O(n^2) repulsion is fine at the class counts kratai typically
	// renders (low hundreds); the sim only runs until it settles (see
	// 'settled' below), not every frame forever, so the cost is a short
	// burst on load, not a sustained per-frame tax. ----
	function simulationTick() {
		var REPULSION_SAME = 260, REPULSION_DIFF = 1900;
		var SPRING = 0.02, IDEAL_LEN_SAME = 34, IDEAL_LEN_DIFF = 150;
		var CENTROID_PULL = 0.05, WORLD_GRAVITY = 0.0012, DAMPING = 0.83;

		var centroids = {};
		folderNames.forEach(function (folder) {
			var group = byFolder[folder];
			var cx = 0, cy = 0, cz = 0;
			group.forEach(function (n) { cx += n.x; cy += n.y; cz += n.z; });
			centroids[folder] = { x: cx / group.length, y: cy / group.length, z: cz / group.length };
		});

		for (var i = 0; i < simNodes.length; i++) {
			var a = simNodes[i];
			// Weak pull toward the whole graph's center, just to stop
			// far-flung folders drifting off-screen forever - deliberately
			// much weaker than CENTROID_PULL below, which does the actual
			// clustering work.
			a.fx = -a.x * WORLD_GRAVITY; a.fy = -a.y * WORLD_GRAVITY; a.fz = -a.z * WORLD_GRAVITY;
			var c = centroids[a.folder];
			a.fx += (c.x - a.x) * CENTROID_PULL; a.fy += (c.y - a.y) * CENTROID_PULL; a.fz += (c.z - a.z) * CENTROID_PULL;
			for (var j = 0; j < simNodes.length; j++) {
				if (i === j) continue;
				var b = simNodes[j];
				var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
				var distSq = Math.max(80, dx * dx + dy * dy + dz * dz);
				var dist = Math.sqrt(distSq);
				var repulsion = a.folder === b.folder ? REPULSION_SAME : REPULSION_DIFF;
				var force = repulsion / distSq;
				a.fx += (dx / dist) * force; a.fy += (dy / dist) * force; a.fz += (dz / dist) * force;
			}
		}
		simEdges.forEach(function (e) {
			var a = byId[e.source], b = byId[e.target];
			var idealLen = a.folder === b.folder ? IDEAL_LEN_SAME : IDEAL_LEN_DIFF;
			var dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
			var dist = Math.max(1, Math.sqrt(dx * dx + dy * dy + dz * dz));
			var force = (dist - idealLen) * SPRING;
			var fx = (dx / dist) * force, fy = (dy / dist) * force, fz = (dz / dist) * force;
			a.fx += fx; a.fy += fy; a.fz += fz;
			b.fx -= fx; b.fy -= fy; b.fz -= fz;
		});
		var totalMotion = 0;
		simNodes.forEach(function (n) {
			n.vx = (n.vx + n.fx) * DAMPING; n.vy = (n.vy + n.fy) * DAMPING; n.vz = (n.vz + n.fz) * DAMPING;
			n.x += n.vx; n.y += n.vy; n.z += n.vz;
			totalMotion += Math.abs(n.vx) + Math.abs(n.vy) + Math.abs(n.vz);
		});
		return totalMotion / Math.max(1, simNodes.length);
	}

	// ---- scene / camera / renderer - same turntable rig Stack Layer uses ----
	var stage = document.getElementById('stage');
	var scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera(38, stage.clientWidth / stage.clientHeight, 1, 8000);
	var camDist = 900, userZoomed = false;

	var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.setSize(stage.clientWidth, stage.clientHeight);
	stage.appendChild(renderer.domElement);

	var rig = new THREE.Group(); scene.add(rig);
	scene.add(new THREE.AmbientLight(0xffffff, 0.8));
	var dl = new THREE.DirectionalLight(0xffffff, 0.7);
	dl.position.set(300, 500, 400);
	scene.add(dl);

	function colorForNode(n) {
		if (n.changeStatus === 'added') return colorVar('--node-added');
		if (n.changeStatus === 'modified') return colorVar('--node-modified');
		if (n.changeStatus === 'deleted') return colorVar('--node-deleted');
		if (n.isEntryPoint) return colorVar('--node-entry');
		return colorVar('--node');
	}

	var nodeGroup = new THREE.Group(); rig.add(nodeGroup);
	simNodes.forEach(function (n) {
		var geo = new THREE.SphereGeometry(radiusFor(n), 12, 12);
		var mat = new THREE.MeshPhysicalMaterial({ color: colorForNode(n), roughness: 0.4, metalness: 0.05, transparent: true, opacity: 1 });
		var mesh = new THREE.Mesh(geo, mat);
		mesh.userData.nodeId = n.id;
		n._mesh = mesh;
		nodeGroup.add(mesh);
	});

	var edgeGroup = new THREE.Group(); rig.add(edgeGroup);
	var edgeColor = cssVar('--edge');
	simEdges.forEach(function (e) {
		var geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
		var mat = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.35 });
		var line = new THREE.Line(geo, mat);
		e._line = line;
		edgeGroup.add(line);
	});

	function syncMeshPositions() {
		simNodes.forEach(function (n) { n._mesh.position.set(n.x, n.y, n.z); });
		simEdges.forEach(function (e) {
			var a = byId[e.source], b = byId[e.target];
			var pos = e._line.geometry.attributes.position;
			pos.setXYZ(0, a.x, a.y, a.z);
			pos.setXYZ(1, b.x, b.y, b.z);
			pos.needsUpdate = true;
		});
	}

	// ---- focus/trace: dim everything outside the clicked node's reachable
	// set (both directions - see reachableFrom) instead of hiding it, so the
	// overall shape stays legible while the traced subgraph still stands out. ----
	var focusedId = null, focusedSet = null;
	function applyFocusStyle() {
		simNodes.forEach(function (n) {
			var dim = focusedSet && !focusedSet[n.id];
			n._mesh.material.opacity = dim ? 0.12 : 1;
			var scale = n.id === focusedId ? 1.5 : 1;
			n._mesh.scale.set(scale, scale, scale);
		});
		simEdges.forEach(function (e) {
			var relevant = !focusedSet || (focusedSet[e.source] && focusedSet[e.target]);
			e._line.material.opacity = relevant ? 0.5 : 0.04;
		});
	}
	var focusBanner = document.getElementById('focus-banner');
	var focusLabel = document.getElementById('focus-label');
	function setFocus(n) {
		focusedId = n.id;
		focusedSet = reachableFrom(n.id);
		focusBanner.style.display = 'flex';
		focusLabel.textContent = 'Tracing from ' + n.name;
		applyFocusStyle();
	}
	function clearFocus() {
		focusedId = null; focusedSet = null;
		focusBanner.style.display = 'none';
		applyFocusStyle();
	}
	document.getElementById('focus-clear').addEventListener('click', clearFocus);

	// ---- turntable rotation + zoom (mirrors stackLayerView.ts exactly, so
	// the two 3D views feel like the same product) ----
	function placeCamera() {
		camera.position.set(camDist * 0.78, camDist * 0.38, camDist * 0.46);
		camera.lookAt(0, 0, 0);
	}
	placeCamera();

	var rotY = 0.6, dragging = false, moved = false, lastX = 0;
	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var autoRotate = !reduceMotion;

	stage.addEventListener('pointerdown', function (e) {
		dragging = true; moved = false; autoRotate = false; lastX = e.clientX;
		stage.classList.add('grabbing');
	});
	window.addEventListener('pointerup', function (e) {
		dragging = false; stage.classList.remove('grabbing');
		if (!moved) handleClick(e);
	});
	window.addEventListener('pointermove', function (e) {
		if (dragging) {
			rotY += (e.clientX - lastX) * 0.006;
			lastX = e.clientX;
			if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) moved = true;
			return;
		}
		handleHover(e);
	});
	stage.addEventListener('wheel', function (e) {
		e.preventDefault();
		userZoomed = true;
		camDist = Math.max(150, Math.min(4000, camDist + e.deltaY * 1.2));
	}, { passive: false });

	// ---- raycasting: which sphere is under the pointer ----
	var raycaster = new THREE.Raycaster();
	var pointerNDC = new THREE.Vector2();
	function nodeUnderPointer(clientX, clientY) {
		var rect = stage.getBoundingClientRect();
		pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(pointerNDC, camera);
		var hits = raycaster.intersectObjects(nodeGroup.children);
		if (!hits.length) return null;
		return byId[hits[0].object.userData.nodeId];
	}

	var tooltip = document.getElementById('tooltip');
	function handleHover(e) {
		var n = nodeUnderPointer(e.clientX, e.clientY);
		if (n) {
			tooltip.style.display = 'block';
			tooltip.style.left = (e.clientX + 14) + 'px';
			tooltip.style.top = (e.clientY + 14) + 'px';
			tooltip.innerHTML = '<div class="name">' + n.name + '</div><div class="folder">' + n.folder + '</div>';
		} else {
			tooltip.style.display = 'none';
		}
	}
	function handleClick(e) {
		var n = nodeUnderPointer(e.clientX, e.clientY);
		if (n) setFocus(n); else clearFocus();
	}

	function onResize() {
		var w = stage.clientWidth, h = stage.clientHeight;
		camera.aspect = w / h; camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	}
	window.addEventListener('resize', onResize);

	var settled = false;
	function tick() {
		if (autoRotate) rotY += 0.0011;
		rig.rotation.y = rotY;
		placeCamera();
		if (!settled) {
			var motion = simulationTick();
			syncMeshPositions();
			if (motion < 0.04) settled = true;
		}
		renderer.render(scene, camera);
		requestAnimationFrame(tick);
	}
	requestAnimationFrame(tick);
})();
</script>
</body>
</html>`;
}
