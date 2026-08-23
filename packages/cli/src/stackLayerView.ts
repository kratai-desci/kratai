import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { StackLayerData } from './stackLayerData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Ported from mockups/architect/app.js's runLayer() (the 3D drill-down
 * layer-stack view) - same visuals, same interaction (drag to rotate,
 * scroll to zoom, click a layer to expand/collapse), same "oversized
 * layer" / "circular dependency" concerns detection.
 *
 * One real substitution: the mockup sized each sheet by lines of code
 * (fake placeholder data - kratai doesn't track per-class line ranges).
 * Real kratai data does have method/parameter counts, so a folder's
 * "score" here is sum(methodCount + paramCount) across its classes -
 * the more methods and parameters live in a folder, the bigger its sheet,
 * standing in for LOC as the "how much code is actually here" signal.
 */
export function generateStackLayerHTML(data: StackLayerData): string {
	const threePath = path.join(__dirname, 'vendor', 'three.module.min.js');
	const threeSource = fs.readFileSync(threePath);
	const threeDataUri = 'data:text/javascript;base64,' + threeSource.toString('base64');
	const dataJSON = JSON.stringify(data);

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.workspaceName} - stack layer</title>
<style>
	:root {
		--bg: #EEF2FA; --surface: #FFFFFF; --surface-2: #F4F7FD;
		--text: #17203A; --text-dim: #5C6785; --text-faint: #94A0BE;
		--border: #DCE3F2; --accent: #3459E0; --accent-2: #14A6B8;
		--modified: #C98A1B;
	}
	@media (prefers-color-scheme: dark) {
		:root:not([data-theme="light"]) {
			--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
			--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
			--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
			--modified: #F0C05A;
		}
	}
	:root[data-theme="dark"] {
		--bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
		--text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488;
		--border: #262E4E; --accent: #6D93F5; --accent-2: #4FDCEA;
		--modified: #F0C05A;
	}
	* { box-sizing: border-box; }
	html, body { margin: 0; padding: 0; height: 100%; }
	body {
		background: var(--bg); color: var(--text);
		font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif;
		overflow: hidden; display: flex; flex-direction: column;
	}
	.mono { font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }

	#errbox {
		display: none;
		position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
		z-index: 999; max-width: 560px;
		background: color-mix(in srgb, #D6455B 12%, transparent);
		border: 1px solid #D6455B; color: var(--text);
		border-radius: 10px; padding: 10px 14px; font-size: 12px;
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
	}
	#errbox strong { color: #D6455B; }

	#stage {
		position: relative; flex: 1; min-height: 0;
		cursor: grab;
		background-image: radial-gradient(color-mix(in srgb, var(--border) 70%, transparent) 1px, transparent 1px);
		background-size: 22px 22px;
	}
	#stage canvas { position: absolute; inset: 0; }
	#stage.grabbing { cursor: grabbing; }

	/* Anchored to the top-left corner via a fixed-position button (see
	   #topleft-layer), mirroring #topright-layer's button-stays-put,
	   panel-grows-toward-center layout, just reflected to the other side. */
	#topleft-layer {
		position: absolute; top: 16px; left: 16px; z-index: 20;
		display: flex; flex-direction: row; align-items: flex-start; gap: 10px;
	}
	#topleft-layer button {
		width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border);
		background: var(--surface);
		background: color-mix(in srgb, var(--surface) 90%, transparent);
		color: var(--text); font-size: 15px; cursor: pointer; backdrop-filter: blur(10px);
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
	}
	#topleft-layer button:hover { border-color: var(--accent); color: var(--accent); }
	#topleft-layer button.active { border-color: var(--accent); color: var(--accent); }

	/* Folder-browser style label list - a fixed panel reads more like a
	   file explorer and stays comfortable to click/scan regardless of how
	   the stack is rotated or zoomed. Visible by default (it's the primary
	   expand/collapse control, not supplementary info like the legend/
	   concerns panels), hidden via the button when it's in the way. */
	#layer-list {
		display: flex; flex-direction: column; gap: 1px;
		width: 240px;
		max-height: calc(100vh - 32px);
		overflow-y: auto;
		background: color-mix(in srgb, var(--surface) 92%, transparent);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 6px;
		backdrop-filter: blur(10px);
	}
	#layer-list.closed { display: none; }
	.slab-face {
		display: flex; flex-direction: row; align-items: baseline;
		gap: 6px; padding: 5px 8px; border-radius: 7px;
		white-space: nowrap; overflow: hidden; line-height: 1.2;
		transition: background 0.15s ease;
	}
	.slab-face.drillable, .slab-face.header { cursor: pointer; }
	.slab-face.drillable:hover, .slab-face.header:hover { background: color-mix(in srgb, var(--accent) 10%, transparent); }
	.slab-face.drillable .slab-label::after { content: ' \\25B8'; opacity: 0.55; }
	.slab-face.leaf { cursor: default; }
	.slab-face.self { opacity: 0.75; }
	.slab-face.self .slab-label { font-style: italic; font-weight: 500; }
	.slab-face.header { background: color-mix(in srgb, var(--accent) 8%, transparent); }
	.slab-face.header .slab-label::after { content: ' \\25BE'; opacity: 0.55; }
	.slab-label {
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 10.5px; font-weight: 650; color: var(--text);
		overflow: hidden; text-overflow: ellipsis;
	}
	.slab-count {
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 9px; color: var(--text-dim); opacity: 0.8;
		margin-left: auto; flex-shrink: 0;
	}

	#hint-layer {
		position: absolute; right: 18px; bottom: 18px; z-index: 10;
		font-size: 11px; color: var(--text-dim);
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
	}

	/* Anchored to the top-right corner via "right", not "left" - so as
	   panels toggle open to the left of the button column, the buttons
	   themselves stay pinned in place instead of the whole group drifting
	   right. Row order (see HTML) puts panels before #layerctl, so in a
	   row flex they land to its left, tidy in one corner instead of
	   scattered around the screen. */
	#topright-layer {
		position: absolute; top: 18px; right: 18px; z-index: 20;
		display: flex; flex-direction: row; align-items: flex-start; gap: 10px;
	}
	#layerctl { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
	#layerctl button {
		width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border);
		background: var(--surface);
		background: color-mix(in srgb, var(--surface) 90%, transparent);
		color: var(--text); font-size: 15px; cursor: pointer; backdrop-filter: blur(10px);
		display: flex; align-items: center; justify-content: center;
	}
	#layerctl button:hover { border-color: var(--accent); color: var(--accent); }
	#layerctl button.active { border-color: var(--accent); color: var(--accent); }

	/* Hidden by default and toggled open from #layerctl (see toggleLegend/
	   toggleConcerns) instead of permanently sitting over the diagram - a
	   permanent overlay was covering real content underneath it. */
	#legend-layer {
		display: none;
		background: color-mix(in srgb, var(--surface) 88%, transparent);
		border: 1px solid var(--border); border-radius: 12px;
		padding: 12px 14px; font-size: 11.5px; color: var(--text-dim);
		backdrop-filter: blur(10px); line-height: 1.6; width: 230px;
	}
	#legend-layer.open { display: block; }
	#legend-layer strong { color: var(--text); }
	#legend-layer .row { display: flex; align-items: center; gap: 7px; margin-top: 2px; }
	#layer-stats { font-weight: 650; color: var(--text); margin-bottom: 6px; font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; font-size: 10.5px; }

	/* Same quiet treatment as #layer-list - a small dot per row is the only
	   hint of yellow, rather than calling attention to itself. Hidden by
	   default and toggled open the same way as #legend-layer. */
	#concerns-layer {
		display: none;
		flex-direction: column; gap: 1px;
		width: 240px; max-height: calc(100vh - 36px); overflow-y: auto;
		background: color-mix(in srgb, var(--surface) 92%, transparent);
		border: 1px solid var(--border); border-radius: 12px;
		padding: 6px; backdrop-filter: blur(10px);
	}
	#concerns-layer.open { display: flex; }
	#concerns-layer strong.title {
		display: block; color: var(--text-dim); font-size: 9.5px;
		font-weight: 650; text-transform: uppercase; letter-spacing: 0.05em;
		padding: 4px 8px 5px;
	}
	.concern-row { display: flex; align-items: flex-start; gap: 7px; padding: 5px 8px; border-radius: 7px; }
	.concern-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; background: var(--modified); }
	.concern-row .concern-text strong { color: var(--text); font-size: 10.5px; font-weight: 650; }
	.concern-row .concern-detail { display: block; color: var(--text-dim); font-size: 9.5px; opacity: 0.85; }
</style>
</head>
<body>
	<div id="errbox"><strong>Render error &mdash;</strong> <span id="errmsg"></span></div>
	<div id="stage">
		<div id="topleft-layer">
			<button id="layerlist-toggle" class="active" title="Hide folder list">
				<svg width="14" height="14" viewBox="0 0 14 14"><path d="M1,3.5 h4 l1.2,1.5 h6.3 v6.5 h-11.5 z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
			</button>
		</div>
		<div id="topright-layer">
			<div id="legend-layer">
				<div id="layer-stats"></div>
				<div><strong>Abstract overview, not detail</strong></div>
				<div class="row">Sheet size = methods + params</div>
				<div class="row">Each line = one class-to-class relationship</div>
				<div class="row">&#9654; arrow points from referencer to referenced</div>
			</div>
			<div id="concerns-layer"></div>
			<div id="layerctl">
				<button id="legend-toggle" title="Show legend">&#9432;</button>
				<button id="concerns-toggle" title="Show concerns" style="display:none">&#9888;</button>
			</div>
		</div>
		<div id="hint-layer">drag to rotate &middot; scroll to zoom &middot; click a layer to expand/collapse</div>
	</div>

	<script type="module">
	import * as THREE from '${threeDataUri}';

	(function () {
		'use strict';

		var errBox = document.getElementById('errbox');
		var errMsg = document.getElementById('errmsg');
		function reportError(err) {
			if (errBox && errMsg) {
				errMsg.textContent = (err && err.message) ? err.message : String(err);
				errBox.style.display = 'block';
			}
			console.error('[kratai stack layer]', err);
		}

		try { runLayer(); } catch (err) { reportError(err); }

		function runLayer() {
		var DATA = ${dataJSON};

		// ---- architecture concerns: two objectively computable kinds - a
		// circular dependency is a structural fact regardless of intent, and
		// a folder with an outsized score relative to its peers is a fact
		// too, not a judgment call about what the "correct" architecture is
		// supposed to be. ----
		function detectConcerns() {
			var concerns = [];

			var idToName = {}, idToFolder = {};
			DATA.folders.forEach(function (f) {
				f.classes.forEach(function (c) { idToName[c.id] = c.name; idToFolder[c.id] = f.path; });
			});
			var edgeSet = {};
			DATA.relationships.forEach(function (r) { edgeSet[r.source + '=>' + r.target] = true; });
			var seenPairs = {};
			DATA.relationships.forEach(function (r) {
				if (r.source === r.target) return;
				if (!edgeSet[r.target + '=>' + r.source]) return;
				var pairKey = [r.source, r.target].sort().join('|');
				if (seenPairs[pairKey]) return;
				seenPairs[pairKey] = true;
				concerns.push({
					text: (idToName[r.source] || r.source) + ' \\u2194 ' + (idToName[r.target] || r.target),
					detail: 'circular dependency \\u2014 each depends on the other',
					folderPaths: [idToFolder[r.source], idToFolder[r.target]].filter(Boolean)
				});
			});

			var scores = DATA.folders.map(function (f) { return f.score || 0; }).filter(function (n) { return n > 0; });
			if (scores.length) {
				var sorted = scores.slice().sort(function (a, b) { return a - b; });
				var mid = Math.floor(sorted.length / 2);
				var medianScore = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
				var BIG_LAYER_MULTIPLIER = 3;
				DATA.folders.forEach(function (f) {
					if ((f.score || 0) > medianScore * BIG_LAYER_MULTIPLIER) {
						concerns.push({
							text: (f.path || '(root)') + ' \\u2014 ' + f.score + ' pts',
							detail: 'over ' + BIG_LAYER_MULTIPLIER + '\\u00d7 the median folder score',
							folderPaths: [f.path]
						});
					}
				});
			}

			return concerns;
		}

		function renderConcerns(container, concerns, onHover) {
			if (!container) return;
			container.innerHTML = '';
			// The toggle button itself is the show/hide affordance now (see
			// toggleConcerns) - only hide it entirely when there's nothing to
			// toggle to.
			var toggleBtn = document.getElementById('concerns-toggle');
			if (!concerns.length) {
				if (toggleBtn) toggleBtn.style.display = 'none';
				return;
			}
			if (toggleBtn) toggleBtn.style.display = '';
			var header = document.createElement('strong');
			header.className = 'title';
			header.textContent = concerns.length + (concerns.length === 1 ? ' concern' : ' concerns');
			container.appendChild(header);
			concerns.forEach(function (c) {
				var row = document.createElement('div');
				row.className = 'concern-row';
				var dot = document.createElement('span');
				dot.className = 'concern-dot';
				row.appendChild(dot);
				var textEl = document.createElement('div');
				textEl.className = 'concern-text';
				textEl.innerHTML = '<strong>' + c.text + '</strong><span class="concern-detail">' + c.detail + '</span>';
				row.appendChild(textEl);
				if (onHover) {
					row.addEventListener('mouseenter', function () { onHover(c, true); });
					row.addEventListener('mouseleave', function () { onHover(c, false); });
				}
				container.appendChild(row);
			});
		}

		renderConcerns(document.getElementById('concerns-layer'), detectConcerns(), function (concern, on) {
			(concern.folderPaths || []).forEach(function (p) { highlightFolderPath(p, on); });
		});

		// Only one of legend/concerns open at a time - opening either closes
		// the other, rather than letting both pile up side by side.
		document.getElementById('legend-toggle').addEventListener('click', function () {
			var opening = !document.getElementById('legend-layer').classList.contains('open');
			document.getElementById('legend-layer').classList.toggle('open', opening);
			this.classList.toggle('active', opening);
			if (opening) {
				document.getElementById('concerns-layer').classList.remove('open');
				document.getElementById('concerns-toggle').classList.remove('active');
			}
		});
		document.getElementById('concerns-toggle').addEventListener('click', function () {
			var opening = !document.getElementById('concerns-layer').classList.contains('open');
			document.getElementById('concerns-layer').classList.toggle('open', opening);
			this.classList.toggle('active', opening);
			if (opening) {
				document.getElementById('legend-layer').classList.remove('open');
				document.getElementById('legend-toggle').classList.remove('active');
			}
		});

		var LAYER_GAP = 13;    // vertical distance between sheets
		var MIN_SIZE = 100, SIZE_PER_SCORE = 6, MAX_SIZE = 220;    // footprint = methods+params, not class count

		var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		// ---- color ramp by rank (shallow -> deep) ----
		var accentRGB = [0x6D, 0x93, 0xF5], accent2RGB = [0x4F, 0xDC, 0xEA];
		var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		if (!isDark) { accentRGB = [0x34, 0x59, 0xE0]; accent2RGB = [0x14, 0xA6, 0xB8]; }
		function lerpColor(t) {
			var c = accentRGB.map(function (v, i) { return Math.round(v + (accent2RGB[i] - v) * t); });
			return new THREE.Color('rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')');
		}

		function median(nums) {
			if (!nums.length) return 9999;
			var sorted = nums.slice().sort(function (a, b) { return a - b; });
			var mid = Math.floor(sorted.length / 2);
			return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
		}

		// ---- build the full folder tree once, with recursive (self + all
		// descendants) class count, score, and layer weight cached per node.
		// A collapsed parent's representative weight is the *median* of its
		// own leaf folders, not the mean - a plain average lets a single
		// outlier (e.g. "app" itself has no recognizable layer keyword, so it
		// defaults to 9999) drag a whole subtree's rank down even when nine
		// of its ten folders are a clean, low "100" api-layer weight. Median
		// shrugs that off; mean doesn't. ----
		var root = { path: '', children: {}, ownClassCount: 0, ownScore: 0, ownWeights: [] };
		DATA.folders.forEach(function (f) {
			var parts = f.path.split('/');
			var node = root;
			var acc = [];
			parts.forEach(function (seg) {
				acc.push(seg);
				var p = acc.join('/');
				if (!node.children[seg]) node.children[seg] = { path: p, children: {}, ownClassCount: 0, ownScore: 0, ownWeights: [] };
				node = node.children[seg];
			});
			node.ownClassCount += f.classes.length;
			node.ownScore += f.score || 0;
			node.ownWeights.push(f.layerWeight);
		});
		(function computeAgg(node) {
			var classCount = node.ownClassCount, score = node.ownScore, weights = node.ownWeights.slice();
			Object.keys(node.children).forEach(function (k) {
				var c = node.children[k];
				computeAgg(c);
				classCount += c._classCount;
				score += c._score;
				weights = weights.concat(c._weights);
			});
			node._classCount = classCount;
			node._score = score;
			node._weights = weights;
			node._avgWeight = median(weights);
		})(root);

		// ---- expand/collapse state: which branches are opened in place.
		// Root's direct children are always shown; expanding one swaps it
		// for its own children without touching sibling branches, so
		// drilling into /lib leaves /app right where it was. ----
		var expanded = {};

		function hasKids(node) { return Object.keys(node.children).length > 0; }

		// A node that's expanded stays in the frontier too, as a "header" row
		// at its own position in the stack - same label, same spot, just
		// flipped to an open state, so the one thing you clicked to drill in
		// is also the thing you click to drill back out.
		function layoutChildren(parentNode) {
			var kids = Object.keys(parentNode.children).map(function (k) { return parentNode.children[k]; });
			var blocks = kids.map(function (child) {
				if (expanded[child.path] && hasKids(child)) {
					child._isHeader = true;
					var inner = layoutChildren(child);
					inner.unshift(child);
					return { weight: child._avgWeight, nodes: inner };
				}
				child._isHeader = false;
				return { weight: child._avgWeight, nodes: [child] };
			});
			blocks.sort(function (a, b) { return a.weight - b.weight; });
			var flat = [];
			blocks.forEach(function (b) { flat = flat.concat(b.nodes); });
			return flat;
		}

		// ---- scene / camera / renderer (built once, contents rebuilt per render) ----
		var stage = document.getElementById('stage');
		var sceneGL = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera(32, stage.clientWidth / stage.clientHeight, 1, 6000);
		var camDist = 500;

		var rendererGL = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		rendererGL.setPixelRatio(Math.min(devicePixelRatio, 2));
		rendererGL.setSize(stage.clientWidth, stage.clientHeight);
		stage.appendChild(rendererGL.domElement);

		var layerList = document.createElement('div');
		layerList.id = 'layer-list';
		document.getElementById('topleft-layer').appendChild(layerList);

		document.getElementById('layerlist-toggle').addEventListener('click', function () {
			var hidden = layerList.classList.toggle('closed');
			this.classList.toggle('active', !hidden);
		});

		var rigGL = new THREE.Group(); sceneGL.add(rigGL);
		sceneGL.add(new THREE.AmbientLight(0xffffff, 0.75));
		var dl = new THREE.DirectionalLight(0xffffff, 0.9);
		dl.position.set(300, 500, 400);
		sceneGL.add(dl);

		var visibleNodes = [];

		var frontierByPath = {};
		function coveringNode(folderPath) {
			var parts = folderPath.split('/');
			for (var i = parts.length; i >= 1; i--) {
				var p = parts.slice(0, i).join('/');
				if (frontierByPath[p]) return frontierByPath[p];
			}
			return null;
		}
		function highlightNode(node) {
			if (!node || !node._sheetMat) return;
			node._sheetMat.opacity = Math.min(1, node._sheetBaseOpacity + 0.4);
			node._borderMat.opacity = 1;
		}
		function unhighlightNode(node) {
			if (!node || !node._sheetMat) return;
			node._sheetMat.opacity = node._sheetBaseOpacity;
			node._borderMat.opacity = 0.85;
		}
		function highlightFolderPath(path, on) {
			var node = coveringNode(path);
			if (!node) return;
			if (on) highlightNode(node); else unhighlightNode(node);
		}

		var tweens = [];
		function tween(duration, onUpdate) {
			tweens.push({ start: performance.now(), duration: duration, onUpdate: onUpdate });
		}
		function stepTweens() {
			if (!tweens.length) return;
			var now = performance.now();
			tweens = tweens.filter(function (tw) {
				var t = Math.min(1, (now - tw.start) / tw.duration);
				var eased = 1 - Math.pow(1 - t, 3);
				tw.onUpdate(eased);
				return t < 1;
			});
		}

		function renderTree() {
			var previousPaths = {}, previousY = {};
			visibleNodes.forEach(function (node) {
				var key = node.path + (node._isSelf ? ':self' : '');
				previousPaths[key] = true;
				previousY[key] = node._y;
			});

			var frontier = layoutChildren(root);

			var n = frontier.length;
			var maxSheetSize = 0;
			frontier.forEach(function (node, i) {
				node._y = ((n - 1) / 2 - i) * LAYER_GAP;
				node._indent = node._isSelf ? node.path.split('/').length : node.path.split('/').length - 1;
				// side ~ sqrt(score) so *area* (side^2) scales linearly with
				// score, not the side length itself
				var side = Math.min(MAX_SIZE, MIN_SIZE + Math.sqrt(node._score) * SIZE_PER_SCORE);
				node._w = side; node._d = side;
				maxSheetSize = Math.max(maxSheetSize, side);
			});
			var stackHeight = Math.max(1, (n - 1) * LAYER_GAP);

			frontierByPath = {};
			frontier.forEach(function (node) { frontierByPath[node.path] = node; });

			var lines = DATA.relationships.map(function (r) {
				if (!r.sourceFolder || !r.targetFolder) return null;
				var sn = coveringNode(r.sourceFolder), tn = coveringNode(r.targetFolder);
				if (!sn || !tn || sn === tn) return null;
				return { source: sn, target: tn, rel: r };
			}).filter(Boolean);

			while (rigGL.children.length) {
				var obj = rigGL.children.pop();
				obj.geometry && obj.geometry.dispose();
				obj.material && obj.material.dispose();
			}
			while (layerList.firstChild) layerList.removeChild(layerList.firstChild);

			var headersByPath = {};
			frontier.forEach(function (node) { if (node._isHeader) headersByPath[node.path] = node; });
			function findOriginHeader(node) {
				var parts = node.path.split('/');
				for (var i = parts.length - 1; i >= 1; i--) {
					var p = parts.slice(0, i).join('/');
					if (headersByPath[p]) return headersByPath[p];
				}
				return null;
			}

			frontier.forEach(function (node, i) {
				node._beamMats = [];

				var key = node.path + (node._isSelf ? ':self' : '');
				var isNew = !previousPaths[key];

				var t = Math.min(1, node._indent * 0.3);
				var color = lerpColor(t);

				var group = new THREE.Group();
				var origin = isNew ? findOriginHeader(node) : null;
				var startY = !isNew ? (previousY[key] !== undefined ? previousY[key] : node._y)
					: (origin ? origin._y : node._y);
				node._animY = startY;
				node._faceIsNewNoOrigin = isNew && !origin;
				group.position.set(0, startY, 0);
				rigGL.add(group);

				if (isNew && origin) {
					var startScale = Math.max(origin._w, origin._d) / Math.max(node._w, node._d);
					group.scale.setScalar(startScale);
					if (!reduceMotion) {
						var targetY1 = node._y;
						tween(380, function (e) {
							var y = startY + (targetY1 - startY) * e;
							node._animY = y;
							group.position.y = y;
							group.scale.setScalar(startScale + (1 - startScale) * e);
						});
					} else {
						node._animY = node._y;
						group.position.y = node._y;
						group.scale.setScalar(1);
					}
				} else if (isNew) {
					if (!reduceMotion) {
						group.scale.setScalar(0.01);
						tween(380, function (e) { group.scale.setScalar(0.01 + e * 0.99); });
					}
				} else if (startY !== node._y && !reduceMotion) {
					var targetY2 = node._y;
					tween(380, function (e) {
						var y = startY + (targetY2 - startY) * e;
						node._animY = y;
						group.position.y = y;
					});
				}

				var baseOpacity = node._isHeader ? 0.1 : 0.22;
				var geo = new THREE.PlaneGeometry(node._w, node._d);
				var mat = new THREE.MeshPhysicalMaterial({
					color: color, transparent: true, opacity: baseOpacity,
					roughness: 0.3, metalness: 0, side: THREE.DoubleSide,
					depthWrite: false
				});
				var mesh = new THREE.Mesh(geo, mat);
				mesh.rotation.x = -Math.PI / 2;
				mesh.renderOrder = 0;
				group.add(mesh);

				var borderMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.85, depthWrite: false });
				var border = new THREE.LineLoop(
					new THREE.BufferGeometry().setFromPoints([
						new THREE.Vector3(-node._w / 2, 0, -node._d / 2), new THREE.Vector3(node._w / 2, 0, -node._d / 2),
						new THREE.Vector3(node._w / 2, 0, node._d / 2), new THREE.Vector3(-node._w / 2, 0, node._d / 2)
					]),
					borderMat
				);
				border.renderOrder = 1;
				group.add(border);

				node._sheetMat = mat;
				node._sheetBaseOpacity = baseOpacity;
				node._borderMat = borderMat;
			});

			frontier.forEach(function (node) {
				var drillable = hasKids(node) && !node._isHeader;
				var face = document.createElement('div');
				face.className = 'slab-face'
					+ (node._isHeader ? ' header' : (drillable ? ' drillable' : ' leaf'))
					+ (node._isSelf ? ' self' : '');

				face.addEventListener('mouseenter', function () {
					highlightNode(node);
					node._beamMats.forEach(function (r) {
						r.items.forEach(function (it) { it.mat.opacity = 1; it.mat.color.set(0xffffff); });
						var other = r.source === node ? r.target : r.source;
						other._sheetMat.opacity = Math.min(1, other._sheetBaseOpacity + 0.18);
						other._borderMat.opacity = Math.min(1, other._borderMat.opacity + 0.1);
					});
				});
				face.addEventListener('mouseleave', function () {
					unhighlightNode(node);
					node._beamMats.forEach(function (r) {
						r.items.forEach(function (it) { it.mat.opacity = it.baseOpacity; it.mat.color.copy(it.baseColor); });
						var other = r.source === node ? r.target : r.source;
						other._sheetMat.opacity = other._sheetBaseOpacity;
						other._borderMat.opacity = 0.85;
					});
				});

				face.style.paddingLeft = (8 + node._indent * 14) + 'px';

				var label = document.createElement('div');
				label.className = 'slab-label';
				label.textContent = node._isSelf ? '(' + node.path.split('/').pop() + ')' : node.path.split('/').pop();
				face.appendChild(label);

				var displayCount = node._isHeader ? node.ownClassCount : node._classCount;
				var count = document.createElement('div');
				count.className = 'slab-count';
				count.textContent = displayCount + (displayCount === 1 ? ' class' : ' classes');
				face.appendChild(count);

				if (node._isHeader) {
					face.title = 'Click to collapse ' + node.path;
					face.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
					face.addEventListener('click', function () { delete expanded[node.path]; renderTree(); });
				} else if (drillable) {
					face.title = 'Click to expand ' + node.path;
					face.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
					face.addEventListener('click', function () { expanded[node.path] = true; renderTree(); });
				}

				layerList.appendChild(face);

				if (node._faceIsNewNoOrigin && !reduceMotion) {
					face.style.opacity = '0';
					face.style.transform = 'scale(0.9)';
					requestAnimationFrame(function () {
						face.style.transition = 'opacity 0.32s ease-out, transform 0.32s cubic-bezier(0.2,0.8,0.3,1.4)';
						face.style.opacity = '1';
						face.style.transform = 'scale(1)';
					});
				}
			});

			function makeArrow(tipPos, dir, color, opacity, coneRadius, coneLength) {
				var geo = new THREE.ConeGeometry(coneRadius, coneLength, 8);
				var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity, depthWrite: false });
				var cone = new THREE.Mesh(geo, mat);
				cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
				cone.position.copy(tipPos).addScaledVector(dir, -coneLength / 2);
				cone.renderOrder = 3;
				rigGL.add(cone);
				return mat;
			}

			var LINE_RADIUS = 0.35, LINE_OPACITY = 0.4;
			var lineColor = lerpColor(0.5);
			lines.forEach(function (l, i) {
				var angle = lines.length > 1 ? (i / lines.length) * Math.PI * 2 : 0;
				var r = Math.min(l.source._w, l.target._w) / 2 * 0.5;

				var start = new THREE.Vector3(Math.cos(angle) * r, l.source._y, Math.sin(angle) * r);
				var end = new THREE.Vector3(Math.cos(angle) * r, l.target._y, Math.sin(angle) * r);

				var curve = new THREE.LineCurve3(start, end);
				var geo = new THREE.TubeGeometry(curve, 1, LINE_RADIUS, 6, false);
				var mat = new THREE.MeshBasicMaterial({
					color: lineColor, transparent: true, opacity: LINE_OPACITY, depthWrite: false
				});
				var lineMesh = new THREE.Mesh(geo, mat);
				lineMesh.renderOrder = 2;
				rigGL.add(lineMesh);

				var dir = end.clone().sub(start).normalize();
				var coneLen = Math.max(6, maxSheetSize * 0.025);
				var coneRad = Math.max(1.6, maxSheetSize * 0.009);
				var arrowMat = makeArrow(end, dir, lineColor, LINE_OPACITY, coneRad, coneLen);

				var lineIsNew = !previousPaths[l.source.path + (l.source._isSelf ? ':self' : '')] ||
					!previousPaths[l.target.path + (l.target._isSelf ? ':self' : '')];
				if (lineIsNew && !reduceMotion) {
					mat.opacity = 0; arrowMat.opacity = 0;
					tween(380, function (e) { mat.opacity = e * LINE_OPACITY; arrowMat.opacity = e * LINE_OPACITY; });
				}

				var lineRef = {
					source: l.source,
					target: l.target,
					items: [
						{ mat: mat, baseColor: lineColor.clone(), baseOpacity: LINE_OPACITY },
						{ mat: arrowMat, baseColor: lineColor.clone(), baseOpacity: LINE_OPACITY }
					]
				};
				l.source._beamMats.push(lineRef);
				l.target._beamMats.push(lineRef);
			});

			camDist = Math.max(500, stackHeight * 1.35 + maxSheetSize * 1.2);
			visibleNodes = frontier;

			var totalClasses = frontier.reduce(function (s, node) {
				return s + (node._isHeader ? node.ownClassCount : node._classCount);
			}, 0);
			document.getElementById('layer-stats').textContent =
				n + (n === 1 ? ' folder' : ' folders') + ' visible \\u00b7 ' + totalClasses + ' classes \\u00b7 ' +
				lines.length + (lines.length === 1 ? ' relationship' : ' relationships');
		}

		function placeCamera() {
			camera.position.set(camDist * 0.78, camDist * 0.38, camDist * 0.46);
			camera.lookAt(0, 0, 0);
		}
		placeCamera();

		renderTree();

		var rotY = 0.6, dragging = false, lastX = 0;
		var autoRotate = !reduceMotion;

		stage.addEventListener('pointerdown', function (e) {
			dragging = true; autoRotate = false; lastX = e.clientX;
			stage.classList.add('grabbing');
		});
		window.addEventListener('pointerup', function () { dragging = false; stage.classList.remove('grabbing'); });
		window.addEventListener('pointermove', function (e) {
			if (!dragging) return;
			rotY += (e.clientX - lastX) * 0.006;
			lastX = e.clientX;
		});
		stage.addEventListener('wheel', function (e) {
			e.preventDefault();
			camDist = Math.max(280, Math.min(3000, camDist + e.deltaY * 1.0));
		}, { passive: false });

		function applyRig() {
			rigGL.rotation.y = rotY;
			placeCamera();
		}

		function onResize() {
			var w = stage.clientWidth, h = stage.clientHeight;
			camera.aspect = w / h; camera.updateProjectionMatrix();
			rendererGL.setSize(w, h);
		}
		window.addEventListener('resize', onResize);

		function tick() {
			if (autoRotate) rotY += 0.0014;
			applyRig();
			stepTweens();
			rendererGL.render(sceneGL, camera);
			requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
		}
	})();
	</script>
</body>
</html>`;
}
