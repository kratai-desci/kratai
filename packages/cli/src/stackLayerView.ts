import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { generateFolderPanelCSS, generateFolderPanelScript } from '@kratai/diagram-view';
import { StackLayerData } from './stackLayerData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Ported from mockups/architect/app.js's runLayer() (the 3D layer-stack
 * view). Sheets come from the exact same leaf-folder set @kratai/diagram-
 * view's class diagram renders as folder boxes, in the same order
 * (stackLayerData.ts) - the two views must never disagree on what counts
 * as a "layer". Drill-down is rebuilt client-side on *top* of that flat,
 * already-aligned list: paths are grouped into a tree by shared prefix,
 * then chains of folders that never branch are compressed away, so a
 * group only appears where two or more real layers actually diverge
 * (this is what broke alignment the first time around - the original
 * tree was built from every raw filesystem segment, including purely
 * organizational folders with no classes of their own). Same drag-to-
 * rotate/scroll-to-zoom interaction, same "oversized layer" / "circular
 * dependency" concerns detection.
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
<script>
	// Runs before first paint to avoid a flash of the wrong theme.
	// localStorage is shared with the shell/other views (same origin), so a
	// choice made anywhere (see viewShell.ts's theme-toggle button) applies
	// here too, even when this page is opened on its own.
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

	${generateFolderPanelCSS({ position: 'fixed', top: '16px', left: '16px' })}

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
		<div id="hint-layer">drag to rotate &middot; scroll to zoom &middot; click a layer to drill in</div>
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

		// ---- scene / camera / renderer ----
		var stage = document.getElementById('stage');
		var sceneGL = new THREE.Scene();
		var camera = new THREE.PerspectiveCamera(32, stage.clientWidth / stage.clientHeight, 1, 6000);
		var camDist = 1000, userZoomed = false;

		var rendererGL = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		rendererGL.setPixelRatio(Math.min(devicePixelRatio, 2));
		rendererGL.setSize(stage.clientWidth, stage.clientHeight);
		stage.appendChild(rendererGL.domElement);

		var rigGL = new THREE.Group(); sceneGL.add(rigGL);
		sceneGL.add(new THREE.AmbientLight(0xffffff, 0.75));
		var dl = new THREE.DirectionalLight(0xffffff, 0.9);
		dl.position.set(300, 500, 400);
		sceneGL.add(dl);

		// Sheets live in their own group and persist across renderStack()
		// calls (see sheetsByPath below) so a drill/hide toggle can glide an
		// unaffected sheet to its new stack position instead of wiping and
		// replaying every sheet's entrance animation. Lines have no state
		// worth keeping between renders - they're fully derived from
		// wherever the sheets currently are - so they stay in a separate
		// group that's simply cleared and rebuilt each time.
		var sheetsGroup = new THREE.Group(); rigGL.add(sheetsGroup);
		var linesGroup = new THREE.Group(); rigGL.add(linesGroup);

		var frontierByPath = {}, leafToVisiblePath = {};
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
		// A sheet's own highlight plus the beams (and beam partners) touching
		// it - shared by hovering its list row and by the concerns panel, so
		// both highlight paths look identical.
		function highlightSheet(node) {
			highlightNode(node);
			(node._beamMats || []).forEach(function (r) {
				r.items.forEach(function (it) { it.mat.opacity = 1; it.mat.color.set(0xffffff); });
				var other = r.source === node ? r.target : r.source;
				other._sheetMat.opacity = Math.min(1, other._sheetBaseOpacity + 0.18);
				other._borderMat.opacity = Math.min(1, other._borderMat.opacity + 0.1);
			});
		}
		function unhighlightSheet(node) {
			unhighlightNode(node);
			(node._beamMats || []).forEach(function (r) {
				r.items.forEach(function (it) { it.mat.opacity = it.baseOpacity; it.mat.color.copy(it.baseColor); });
				var other = r.source === node ? r.target : r.source;
				other._sheetMat.opacity = other._sheetBaseOpacity;
				other._borderMat.opacity = 0.85;
			});
		}
		// A concern names a leaf folder path (the ground truth - see
		// detectConcerns), which may currently be folded into a collapsed
		// group; resolve through leafToVisiblePath to whichever sheet is
		// actually on screen right now.
		function highlightFolderPath(path, on) {
			var node = frontierByPath[leafToVisiblePath[path] || path];
			if (!node) return;
			if (on) highlightSheet(node); else unhighlightSheet(node);
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

		function clearLines() {
			while (linesGroup.children.length) {
				var obj = linesGroup.children[0];
				linesGroup.remove(obj);
				if (obj.geometry) obj.geometry.dispose();
				if (obj.material) obj.material.dispose();
			}
		}

		function disposeSheet(s) {
			sheetsGroup.remove(s.group);
			s.mesh.geometry.dispose(); s.mat.dispose();
			s.border.geometry.dispose(); s.borderMat.dispose();
		}

		function makeArrow(tipPos, dir, color, opacity, coneRadius, coneLength) {
			var geo = new THREE.ConeGeometry(coneRadius, coneLength, 8);
			var mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity, depthWrite: false });
			var cone = new THREE.Mesh(geo, mat);
			cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
			cone.position.copy(tipPos).addScaledVector(dir, -coneLength / 2);
			cone.renderOrder = 3;
			linesGroup.add(cone);
			return mat;
		}

		// Real folder data (score/class count) keyed by path, for sizing
		// sheets - the shared folder panel (see folderPanelScript.ts) only
		// knows about path/name/hidden/expanded, not this view's own idea
		// of "how big is this layer", so applyFolderPlan looks it up here
		// per plan item.
		var folderByPath = {};
		DATA.folders.forEach(function (f) { folderByPath[f.path] = f; });

		var LINE_RADIUS = 0.35, LINE_OPACITY = 0.4;
		var REPOSITION_DURATION = 320, EXIT_DURATION = 260;
		var sheetsByPath = {};
		var renderGeneration = 0;

		// Called by the shared folder panel (folderPanelScript.ts) whenever
		// drill-down/hide/order state changes - a flat plan of what's
		// currently visible, each entry either a real leaf folder standing
		// alone or a collapsed group representing everything folded into it
		// (mirrored 1:1 by the class diagram's own applyFolderPlan, just
		// building 3D sheets here instead of merging DOM boxes).
		//
		// ---- sheets: reuse whatever's already on screen. A sheet whose
		// path key survives between renders just glides to its new stack
		// position (its size/score can't have changed - a surviving node's
		// own class count is untouched by anything that toggles elsewhere);
		// only genuinely new sheets grow in, only genuinely removed ones
		// shrink away. This is what makes a drill/hide toggle read as "one
		// layer moves, another appears/disappears" instead of the whole
		// stack reloading. ----
		window.applyFolderPlan = function (plan) {
			var myGeneration = ++renderGeneration;

			leafToVisiblePath = {};
			var visible = plan.filter(function (item) { return !item.hidden; }).map(function (item) {
				if (item.type === 'leaf') {
					leafToVisiblePath[item.path] = item.path;
					var f = folderByPath[item.path];
					return { isGroup: false, path: item.path, score: f ? f.score : 0 };
				}
				var score = 0;
				item.realPaths.forEach(function (p) {
					leafToVisiblePath[p] = item.path;
					var f = folderByPath[p];
					if (f) score += f.score;
				});
				return { isGroup: true, path: item.path, score: score };
			});

			frontierByPath = {};
			var n = visible.length;
			var maxSheetSize = 0;
			visible.forEach(function (node, i) {
				node._y = ((n - 1) / 2 - i) * LAYER_GAP;
				// side ~ sqrt(score) so *area* (side^2) scales linearly with
				// score, not the side length itself
				var side = Math.min(MAX_SIZE, MIN_SIZE + Math.sqrt(node.score) * SIZE_PER_SCORE);
				node._w = side; node._d = side;
				maxSheetSize = Math.max(maxSheetSize, side);
				frontierByPath[node.path] = node;
			});
			var stackHeight = Math.max(1, (n - 1) * LAYER_GAP);

			var lines = DATA.relationships.map(function (r) {
				var sp = leafToVisiblePath[r.sourceFolder], tp = leafToVisiblePath[r.targetFolder];
				var sn = sp ? frontierByPath[sp] : null, tn = tp ? frontierByPath[tp] : null;
				if (!sn || !tn || sn === tn) return null;
				return { source: sn, target: tn };
			}).filter(Boolean);

			var seenPaths = {};
			visible.forEach(function (node, i) {
				node._beamMats = [];

				// color reflects sort position (shallow -> deep in the
				// stack), not folder-tree depth - a quick "top of the stack
				// is one color, bottom is another" gradient to read the
				// stack at a glance regardless of how much is drilled in.
				var t = n > 1 ? i / (n - 1) : 0;
				var color = lerpColor(t);
				seenPaths[node.path] = true;

				var existing = sheetsByPath[node.path];
				if (existing) {
					existing.mat.color.copy(color);
					existing.borderMat.color.copy(color);
					var fromY = existing.group.position.y, toY = node._y;
					if (!reduceMotion && fromY !== toY) {
						tween(REPOSITION_DURATION, function (e) { existing.group.position.y = fromY + (toY - fromY) * e; });
					} else {
						existing.group.position.y = toY;
					}
					// A folder that both owns classes directly and has
					// subfolders reuses this same path key whether it's
					// showing as a collapsed group's aggregate sheet or (once
					// expanded) its own "self" sheet - keep the opacity
					// consistent with whichever it currently is.
					var targetBaseOpacity = node.isGroup ? 0.32 : 0.22;
					if (existing.baseOpacity !== targetBaseOpacity) {
						existing.baseOpacity = targetBaseOpacity;
						existing.mat.opacity = targetBaseOpacity;
					}
					node._sheetMat = existing.mat;
					node._sheetBaseOpacity = existing.baseOpacity;
					node._borderMat = existing.borderMat;
					return;
				}

				// Collapsed groups sit a touch more opaque than a single
				// real layer - a quiet visual hint that there's more folded
				// into this sheet than one folder's worth of classes.
				var baseOpacity = node.isGroup ? 0.32 : 0.22;
				var group = new THREE.Group();
				group.position.set(0, node._y, 0);
				sheetsGroup.add(group);

				if (!reduceMotion) {
					group.scale.setScalar(0.01);
					tween(380 + Math.min(i * 12, 400), function (e) { group.scale.setScalar(0.01 + e * 0.99); });
				}

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

				sheetsByPath[node.path] = { group: group, mesh: mesh, mat: mat, border: border, borderMat: borderMat, baseOpacity: baseOpacity };
				node._sheetMat = mat;
				node._sheetBaseOpacity = baseOpacity;
				node._borderMat = borderMat;
			});

			// Sheets left over from the previous render that didn't survive
			// this one shrink away instead of just vanishing.
			Object.keys(sheetsByPath).forEach(function (path) {
				if (seenPaths[path]) return;
				var s = sheetsByPath[path];
				delete sheetsByPath[path];
				if (reduceMotion) { disposeSheet(s); return; }
				tween(EXIT_DURATION, function (e) {
					s.group.scale.setScalar(Math.max(0.01, 1 - e));
					s.mat.opacity = s.baseOpacity * (1 - e);
					s.borderMat.opacity = 0.85 * (1 - e);
					if (e >= 1) disposeSheet(s);
				});
			});

			// Lines have no identity worth preserving - fully derived from
			// wherever the sheets currently are - so they're simply rebuilt.
			// Delayed until sheets have (roughly) finished gliding to their
			// new positions, so a line doesn't appear anchored to where a
			// sheet is *going* while it's still visibly on its way there;
			// the generation check drops this if another toggle landed
			// first.
			function buildLines() {
				if (myGeneration !== renderGeneration) return;
				clearLines();
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
					linesGroup.add(lineMesh);

					var dir = end.clone().sub(start).normalize();
					var coneLen = Math.max(6, maxSheetSize * 0.025);
					var coneRad = Math.max(1.6, maxSheetSize * 0.009);
					var arrowMat = makeArrow(end, dir, lineColor, LINE_OPACITY, coneRad, coneLen);

					mat.opacity = 0; arrowMat.opacity = 0;
					tween(260, function (e) { mat.opacity = e * LINE_OPACITY; arrowMat.opacity = e * LINE_OPACITY; });

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
			}
			if (!reduceMotion) setTimeout(buildLines, REPOSITION_DURATION);
			else buildLines();

			// Auto-fit the camera to whatever's currently drilled into,
			// unless the user has already zoomed by hand - drilling in or
			// back out shouldn't fight a zoom level they chose themselves.
			if (!userZoomed) camDist = Math.max(1000, stackHeight * 1.5 + maxSheetSize * 1.4);

			var totalClasses = DATA.folders.reduce(function (s, f) { return s + f.classes.length; }, 0);
			document.getElementById('layer-stats').textContent =
				n + (n === 1 ? ' layer' : ' layers') + ' \\u00b7 ' +
				totalClasses + (totalClasses === 1 ? ' class' : ' classes') + ' \\u00b7 ' +
				lines.length + (lines.length === 1 ? ' relationship' : ' relationships');
		};

		window.highlightFolderPaths = function (paths, on) {
			paths.forEach(function (p) {
				var node = frontierByPath[p];
				if (!node) return;
				if (on) highlightSheet(node); else unhighlightSheet(node);
			});
		};

		// ---- folder panel (drill-down, hide/show, drag-reorder) - see
		// folderPanelScript.ts for the tree/drag logic itself, shared with
		// the class diagram's own panel so both look and behave identically. ----
		window.FOLDER_PANEL_LEAVES = DATA.folders.map(function (f) { return { path: f.path, name: f.name }; });
		window.FOLDER_PANEL_INITIAL_HIDDEN = DATA.initialHidden || [];
		window.FOLDER_PANEL_INITIAL_EXPANDED = DATA.initialExpanded || [];
		window.FOLDER_PANEL_INITIAL_OPEN = DATA.initialPanelOpen;
		${generateFolderPanelScript()}

		function placeCamera() {
			camera.position.set(camDist * 0.78, camDist * 0.38, camDist * 0.46);
			camera.lookAt(0, 0, 0);
		}
		placeCamera();

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
			userZoomed = true;
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
