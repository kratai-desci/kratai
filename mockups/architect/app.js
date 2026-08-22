import * as THREE from 'three';

(function () {
	'use strict';

	var errBox = document.getElementById('errbox');
	var errMsg = document.getElementById('errmsg');
	function reportError(err) {
		if (errBox && errMsg) {
			errMsg.textContent = (err && err.message) ? err.message : String(err);
			errBox.style.display = 'block';
		}
		console.error('[kratai mockup]', err);
	}

	// Shared between both views: each renderer stashes its latest stats
	// string here instead of writing #stats directly, so switching views
	// shows the right text immediately without forcing a full re-render of
	// whichever view you're leaving.
	var activeView = 'layer';
	var statsByView = { layer: '', class: '' };
	function setStats(view, text) {
		statsByView[view] = text;
		if (view === activeView) document.getElementById('stats').textContent = text;
	}

	// Three.js keeps rendering every frame regardless of visibility (a hidden
	// canvas still costs a full draw call) - this flag lets tick() skip the
	// actual render work while the layer-stack view isn't the active one,
	// without tearing down and rebuilding the rAF loop itself.
	var layerViewActive = true;

	try { runLayer(); } catch (err) { reportError(err); }
	try { runClass(); } catch (err) { reportError(err); }
	setupSwitcher();

	function setupSwitcher() {
		var stageEl = document.getElementById('stage');
		var viewportEl = document.getElementById('viewport');
		var buttons = Array.prototype.slice.call(document.querySelectorAll('#view-switch button'));
		buttons.forEach(function (btn) {
			btn.addEventListener('click', function () {
				var view = btn.dataset.view;
				if (view === activeView) return;
				activeView = view;
				layerViewActive = (view === 'layer');
				buttons.forEach(function (b) { b.classList.toggle('active', b === btn); });
				stageEl.classList.toggle('active', view === 'layer');
				viewportEl.classList.toggle('active', view === 'class');
				document.getElementById('stats').textContent = statsByView[view];
			});
		});
	}

	// ================= Layer stack (3D drill-down) =================
	function runLayer() {
	var DATA = /*__DATA_LAYER__*/ null;

	var LAYER_GAP = 13;    // vertical distance between sheets
	var MIN_SIZE = 100, SIZE_PER_CLASS = 16, MAX_SIZE = 220;
	var LIST_INDENT_STEP = 14;    // per-depth-level left-padding in the label list, folder-tree style
	var INDENT_COLOR_STEP = 0.3;    // per-depth-level advance along the color gradient

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
	// descendants) class count and layer weight cached per node. A
	// collapsed parent's representative weight is the *median* of its own
	// leaf folders, not the mean - a plain average lets a single outlier
	// (e.g. "app" itself has no recognizable layer keyword, so it defaults
	// to 9999) drag a whole subtree's rank down even when nine of its ten
	// folders are a clean, low "100" api-layer weight. Median shrugs that
	// off; mean doesn't. ----
	var root = { path: '', children: {}, ownClassCount: 0, ownWeights: [] };
	DATA.folders.forEach(function (f) {
		var parts = f.path.split('/');
		var node = root;
		var acc = [];
		parts.forEach(function (seg) {
			acc.push(seg);
			var p = acc.join('/');
			if (!node.children[seg]) node.children[seg] = { path: p, children: {}, ownClassCount: 0, ownWeights: [] };
			node = node.children[seg];
		});
		node.ownClassCount += f.classes.length;
		node.ownWeights.push(f.layerWeight);
	});
	(function computeAgg(node) {
		var classCount = node.ownClassCount, weights = node.ownWeights.slice();
		Object.keys(node.children).forEach(function (k) {
			var c = node.children[k];
			computeAgg(c);
			classCount += c._classCount;
			weights = weights.concat(c._weights);
		});
		node._classCount = classCount;
		node._weights = weights;
		node._avgWeight = median(weights);
	})(root);

	// ---- expand/collapse state: which branches are opened in place. Root's
	// direct children are always shown; expanding one swaps it for its own
	// children without touching sibling branches, so drilling into /lib
	// leaves /app right where it was. ----
	var expanded = {};

	function hasKids(node) { return Object.keys(node.children).length > 0; }

	// A node that's expanded stays in the frontier too, as a "header" row at
	// its own position in the stack - same label, same spot, just flipped to
	// an open state, so the one thing you clicked to drill in is also the
	// thing you click to drill back out. Headers are excluded from beam
	// routing since their content is now fully represented by their
	// (also-visible) children.
	//
	// An expanded node's whole subtree (header + descendants) is built and
	// sorted as one atomic block before it's ever compared against sibling
	// weights - an unsorted flat weight-sort would let an unrelated sibling
	// (e.g. "lib") land, by pure chance, between two of "app"'s own children,
	// splitting the group apart instead of keeping it contiguous.
	//
	// This same order drives both the label list and the 3D stack's height
	// (index 0 = top of the list = top of the stack, see the frontier._y
	// assignment below) - one ordering, read the same direction in both
	// places, so a header always sits directly above its own children in
	// both views instead of the two disagreeing about which end is "up".
	function layoutChildren(parentNode) {
		var kids = Object.keys(parentNode.children).map(function (k) { return parentNode.children[k]; });
		var blocks = kids.map(function (child) {
			if (expanded[child.path] && hasKids(child)) {
				child._isHeader = true;
				// layoutChildren(child) already returns its own contents
				// correctly block-sorted (atomic sub-blocks intact) - re-sorting
				// that flat by each element's own _avgWeight would split a
				// nested header away from its own children, since a header's
				// weight is an *average* that can fall numerically between them
				var inner = layoutChildren(child);
				inner.unshift(child); // header always heads its own block
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

	// Folder-browser style label list: plain DOM, anchored top-left, laid out
	// in normal document flow rather than projected onto each sheet's 3D
	// position each frame - reads as a stable file-explorer list regardless
	// of how the stack is rotated/zoomed.
	var layerList = document.createElement('div');
	layerList.id = 'layer-list';
	stage.appendChild(layerList);

	var rigGL = new THREE.Group(); sceneGL.add(rigGL);
	sceneGL.add(new THREE.AmbientLight(0xffffff, 0.75));
	var dl = new THREE.DirectionalLight(0xffffff, 0.9);
	dl.position.set(300, 500, 400);
	sceneGL.add(dl);

	var visibleNodes = []; // frontier nodes, for per-frame HUD label positioning

	// Tiny tween runner: each entry gets its progress (0..1, eased) fed to
	// onUpdate every frame in tick() until it completes. Used so newly
	// revealed sheets/lines grow and fade in on drill-in instead of just
	// appearing, without needing a full old-state/new-state diff+morph.
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
		// which paths were already on screen before this render (and where),
		// so newly revealed nodes/lines can grow in while nodes that were
		// already visible slide smoothly from their old height to their new
		// one instead of jumping - expanding pushes siblings apart, collapsing
		// closes the gap, both are just "the height changed" to this code.
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
			// index 0 (the label list's top row) gets the highest y, so the
			// 3D stack's top-to-bottom reading matches the list's
			node._y = ((n - 1) / 2 - i) * LAYER_GAP;
			// indent like a folder tree: deeper nesting shifts the label
			// right. A "self" node displays alongside its parent's real
			// children, so it indents one level past its own path depth.
			node._indent = node._isSelf ? node.path.split('/').length : node.path.split('/').length - 1;
			var side = Math.min(MAX_SIZE, MIN_SIZE + Math.sqrt(node._classCount) * SIZE_PER_CLASS);
			node._w = side; node._d = side;
			maxSheetSize = Math.max(maxSheetSize, side);
		});
		var stackHeight = Math.max(1, (n - 1) * LAYER_GAP);

		// headers now cover their own direct-file relationships too, since
		// there's no separate "(name)" sheet claiming that path anymore
		var frontierByPath = {};
		frontier.forEach(function (node) { frontierByPath[node.path] = node; });

		// longest-prefix match: which visible (frontier) node "covers" a given
		// real folder path - itself if visible, else the nearest collapsed
		// ancestor standing in for it.
		function coveringNode(folderPath) {
			var parts = folderPath.split('/');
			for (var i = parts.length; i >= 1; i--) {
				var p = parts.slice(0, i).join('/');
				if (frontierByPath[p]) return frontierByPath[p];
			}
			return null;
		}

		// One line per actual relationship, not aggregated by folder-pair -
		// so ten class-to-class references between the same two folders draw
		// as ten distinct thin lines fanned across the sheets, not one
		// thickness-coded average. Each has a real, definite direction
		// (source -> target), no more inferring "mostly down" from a count.
		var lines = DATA.relationships.map(function (r) {
			if (!r.sourceFolder || !r.targetFolder) return null;
			var sn = coveringNode(r.sourceFolder), tn = coveringNode(r.targetFolder);
			if (!sn || !tn || sn === tn) return null;
			return { source: sn, target: tn, rel: r };
		}).filter(Boolean);

		// clear previous render's 3D content and labels
		while (rigGL.children.length) {
			var obj = rigGL.children.pop();
			obj.geometry && obj.geometry.dispose();
			obj.material && obj.material.dispose();
		}
		while (layerList.firstChild) layerList.removeChild(layerList.firstChild);

		// a newly revealed node's animation origin is its nearest expanded
		// ancestor (the header someone just clicked) - it starts at that
		// header's position/size and eases into its own, like a copy peeling
		// off the parent, rather than growing out of nothing
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
			// populated below once the beam meshes are built (after this loop);
			// the hover listener reads it later, at interaction time, so the
			// fill-in order doesn't matter
			node._beamMats = [];

			var key = node.path + (node._isSelf ? ':self' : '');
			var isNew = !previousPaths[key];

			// color reflects folder depth, not stack position - two sheets at
			// the same tree level always match. A fixed step per level (not
			// normalized against whatever's currently visible) means each
			// drill-in always advances the gradient by the same amount,
			// instead of every expand/collapse rescaling where things land.
			var t = Math.min(1, node._indent * INDENT_COLOR_STEP);
			var color = lerpColor(t);

			// mesh + border share a group, animated as one unit
			var group = new THREE.Group();
			var origin = isNew ? findOriginHeader(node) : null;
			var startY = !isNew ? (previousY[key] !== undefined ? previousY[key] : node._y)
				: (origin ? origin._y : node._y);
			node._animY = startY;
			// read back in the label-list loop below, which runs in a
			// different order (list order, not 3D-stack order) so it can't
			// just reuse this loop's local isNew/origin closures directly
			node._faceIsNewNoOrigin = isNew && !origin;
			group.position.set(0, startY, 0);
			rigGL.add(group);

			if (isNew && origin) {
				// peels off the header that was just clicked: starts at that
				// header's position and (roughly) its size, then eases into
				// its own spot/size - reads as "a copy of the parent split
				// off and moved out", not "appeared from nothing"
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
				// no parent to peel off (e.g. the very first render) - just
				// grow in place
				if (!reduceMotion) {
					group.scale.setScalar(0.01);
					tween(380, function (e) { group.scale.setScalar(0.01 + e * 0.99); });
				}
			} else if (startY !== node._y && !reduceMotion) {
				// a sheet that was already visible but whose height changed
				// (a sibling was expanded/collapsed above or below it) slides
				// to its new spot instead of jumping; node._animY tracks the
				// in-flight value so the HUD label follows the same motion
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

			// so the label's hover handler can brighten this exact sheet
			node._sheetMat = mat;
			node._sheetBaseOpacity = baseOpacity;
			node._borderMat = borderMat;
		});

		// Label list: same frontier order as the 3D stack (see above), read
		// top-to-bottom the same direction - a header sits directly above
		// its own children in both views.
		frontier.forEach(function (node) {
			var drillable = hasKids(node) && !node._isHeader;
			var face = document.createElement('div');
			face.className = 'slab-face'
				+ (node._isHeader ? ' header' : (drillable ? ' drillable' : ' leaf'))
				+ (node._isSelf ? ' self' : '');

			// all labels share the same plain background regardless of
			// depth - indentation and color already show where you are in
			// the tree, no need for a third depth signal on the label itself

			// hovering the label brightens the sheet it refers to and every
			// relationship line attached to it (full white), plus a softer
			// highlight on whatever's at the other end of each of those
			// lines - so the destination reads as "connected to" rather than
			// "the thing you're pointing at".
			face.addEventListener('mouseenter', function () {
				node._sheetMat.opacity = Math.min(1, node._sheetBaseOpacity + 0.4);
				node._borderMat.opacity = 1;
				node._beamMats.forEach(function (r) {
					r.items.forEach(function (it) { it.mat.opacity = 1; it.mat.color.set(0xffffff); });
					var other = r.source === node ? r.target : r.source;
					other._sheetMat.opacity = Math.min(1, other._sheetBaseOpacity + 0.18);
					other._borderMat.opacity = Math.min(1, other._borderMat.opacity + 0.1);
				});
			});
			face.addEventListener('mouseleave', function () {
				node._sheetMat.opacity = node._sheetBaseOpacity;
				node._borderMat.opacity = 0.85;
				node._beamMats.forEach(function (r) {
					r.items.forEach(function (it) { it.mat.opacity = it.baseOpacity; it.mat.color.copy(it.baseColor); });
					var other = r.source === node ? r.target : r.source;
					other._sheetMat.opacity = other._sheetBaseOpacity;
					other._borderMat.opacity = 0.85;
				});
			});

			face.style.paddingLeft = (8 + node._indent * LIST_INDENT_STEP) + 'px';

			var label = document.createElement('div');
			label.className = 'slab-label';
			label.textContent = node._isSelf ? '(' + node.path.split('/').pop() + ')' : node.path.split('/').pop();
			face.appendChild(label);

			// a header shows only its own direct-file count, not the full
			// subtree total - the subtree is already broken out as its
			// (also-visible) children, so the aggregate would just repeat them
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
			node._labelEl = face;

			if (node._faceIsNewNoOrigin && !reduceMotion) {
				// no parent header to slide out from (e.g. first render) -
				// fall back to a simple grow/fade in place
				face.style.opacity = '0';
				face.style.transform = 'scale(0.9)';
				requestAnimationFrame(function () {
					face.style.transition = 'opacity 0.32s ease-out, transform 0.32s cubic-bezier(0.2,0.8,0.3,1.4)';
					face.style.opacity = '1';
					face.style.transform = 'scale(1)';
				});
			}
		});

		// A cone arrowhead at the tip, oriented along the beam - built once
		// per direction needed and shares the tube's color/opacity so hover
		// can swap both to white together.
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

		// One shared slot per line (not a separate one at each end) - so a
		// line's start and end sit at the exact same x/z, making it a
		// straight vertical drop between the two sheets instead of a
		// diagonal that visually twists as the stack rotates. Lines are
		// still spread evenly around the shared axis so they don't overlap.
		var LINE_RADIUS = 0.35, LINE_OPACITY = 0.4;
		var color = lerpColor(0.5);
		lines.forEach(function (l, i) {
			var angle = lines.length > 1 ? (i / lines.length) * Math.PI * 2 : 0;
			// smaller of the two sheets, so the point never falls outside
			// either one's edge even when they're very different sizes
			var r = Math.min(l.source._w, l.target._w) / 2 * 0.5;

			var start = new THREE.Vector3(Math.cos(angle) * r, l.source._y, Math.sin(angle) * r);
			var end = new THREE.Vector3(Math.cos(angle) * r, l.target._y, Math.sin(angle) * r);

			var curve = new THREE.LineCurve3(start, end);
			var geo = new THREE.TubeGeometry(curve, 1, LINE_RADIUS, 6, false);
			var mat = new THREE.MeshBasicMaterial({
				color: color, transparent: true, opacity: LINE_OPACITY,
				depthWrite: false
			});
			// Sheets and lines are both translucent, so their per-object draw
			// order can flip as the camera rotates, making one pop in front of
			// the other frame to frame. depthWrite:false stops them fighting
			// over the depth buffer; renderOrder keeps lines reliably drawn
			// on top instead of the order being rotation-dependent.
			var lineMesh = new THREE.Mesh(geo, mat);
			lineMesh.renderOrder = 2;
			rigGL.add(lineMesh);

			// arrow always points source -> target, the real reference
			// direction, not an inferred "mostly shallow to deep" guess
			var dir = end.clone().sub(start).normalize();
			var coneLen = Math.max(6, maxSheetSize * 0.025);
			var coneRad = Math.max(1.6, maxSheetSize * 0.009);
			var arrowColor = color;
			var arrowOpacity = LINE_OPACITY;
			var arrowMat = makeArrow(end, dir, arrowColor, arrowOpacity, coneRad, coneLen);

			// fade in if either end just appeared this render, same as the
			// sheets themselves - a line snapping in ahead of the sheet it's
			// attached to still growing would look off
			var lineIsNew = !previousPaths[l.source.path + (l.source._isSelf ? ':self' : '')] ||
				!previousPaths[l.target.path + (l.target._isSelf ? ':self' : '')];
			if (lineIsNew && !reduceMotion) {
				mat.opacity = 0; arrowMat.opacity = 0;
				tween(380, function (e) { mat.opacity = e * LINE_OPACITY; arrowMat.opacity = e * arrowOpacity; });
			}

			// let either endpoint's label hover highlight this line (and its
			// arrowhead) too - swap to white. Line and arrow now have
			// different base colors/opacities, so each material tracks its
			// own for restore instead of sharing one.
			var lineRef = {
				source: l.source,
				target: l.target,
				items: [
					{ mat: mat, baseColor: color.clone(), baseOpacity: LINE_OPACITY },
					{ mat: arrowMat, baseColor: arrowColor.clone(), baseOpacity: arrowOpacity }
				]
			};
			l.source._beamMats.push(lineRef);
			l.target._beamMats.push(lineRef);
		});

		camDist = Math.max(500, stackHeight * 1.35 + maxSheetSize * 1.2);
		visibleNodes = frontier;

		// a header's own displayed count is just its direct files (its
		// subtree total is already covered by its visible children)
		var totalClasses = frontier.reduce(function (s, node) {
			return s + (node._isHeader ? node.ownClassCount : node._classCount);
		}, 0);
		setStats('layer',
			n + (n === 1 ? ' folder' : ' folders') + ' visible · ' + totalClasses + ' classes · ' +
			lines.length + (lines.length === 1 ? ' relationship' : ' relationships'));
	}

// ---- camera: mostly side-on so the stack reads as a layered elevation,
	// just enough elevation for a 3D depth cue, not a top-down 3/4 view ----
	function placeCamera() {
		camera.position.set(camDist * 0.78, camDist * 0.38, camDist * 0.46);
		camera.lookAt(0, 0, 0);
	}
	placeCamera();

	renderTree();

	// ---- interaction: horizontal orbit only, the stack always stays upright ----
	var rotY = 0.6, dragging = false, lastX = 0;
	var autoRotate = !reduceMotion;

	stage.addEventListener('pointerdown', function (e) {
		dragging = true; autoRotate = false; lastX = e.clientX;
	});
	window.addEventListener('pointerup', function () { dragging = false; });
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
		if (layerViewActive) {
			if (autoRotate) rotY += 0.0014;
			applyRig();
			stepTweens();
			rendererGL.render(sceneGL, camera);
		}
		requestAnimationFrame(tick);
	}
	requestAnimationFrame(tick);
	}

	// ================= Class diagram (2D pan/zoom) =================
	function runClass() {
	var DATA = /*__DATA_CLASS__*/ null;
	var MAX_ROWS = 6;

	var foldersEl = document.getElementById('folders');
	var svg = document.getElementById('lines');
	var world = document.getElementById('world');
	var viewport = document.getElementById('viewport');

	function esc(s) {
		return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	// Ported from packages/diagram-view/src/components/folderBoxRenderer.ts -
	// same dictionary, same "check both path and name, exact-match beats
	// longest-substring-match, lowest weight across every token wins" logic,
	// so folder order here matches what the real product would produce for
	// the same tree. Config-based per-folder order overrides are omitted -
	// this mockup has no KrataiConfig to read one from.
	var LAYER_WEIGHTS = {
		"api": 100, "apis": 100, "get": 100, "post": 100, "put": 100, "patch": 100,
		"delete": 100, "head": 100, "options": 100, "websocket": 100, "ws": 100,
		"webhook": 100, "webhooks": 100, "endpoints": 105, "endpoint": 105,
		"graphql": 110, "mutation": 110, "subscription": 110,
		"middleware": 200, "middlewares": 200, "interceptors": 205, "interceptor": 205,
		"guards": 210, "guard": 210, "filters": 215, "filter": 215,
		"routes": 300, "route": 300, "routing": 300, "urls": 305, "url": 305,
		"controllers": 400, "controller": 400, "handlers": 405, "handler": 405,
		"views": 400, "view": 400, "pages": 400, "page": 400, "screens": 400, "screen": 400,
		"services": 500, "service": 500, "usecases": 505, "use-cases": 505, "usecase": 505,
		"business": 510, "domain": 515, "domains": 515, "core": 520, "providers": 520,
		"provider": 520, "store": 520, "stores": 520, "commands": 525, "command": 525,
		"actions": 525, "action": 525, "reducers": 528, "reducer": 528,
		"queries": 530, "query": 530, "processors": 535, "processor": 535,
		"workflows": 540, "workflow": 540,
		"config": 600, "configuration": 600, "settings": 605, "utils": 610, "util": 610,
		"utilities": 610, "helpers": 615, "helper": 615, "hooks": 618, "hook": 618,
		"common": 620, "shared": 625, "lib": 630, "libs": 630, "library": 630,
		"types": 635, "type": 635, "interfaces": 640, "interface": 640,
		"constants": 645, "constant": 645, "enums": 650, "enum": 650,
		"adapters": 655, "adapter": 655, "clients": 660, "client": 660,
		"external": 665, "integrations": 670, "integration": 670,
		"features": 675, "feature": 675, "modules": 680, "module": 680,
		"repositories": 700, "repository": 700, "repos": 700, "repo": 700,
		"dal": 705, "dataaccess": 705, "data-access": 705, "persistence": 710,
		"models": 800, "model": 800, "dto": 805, "dtos": 805, "entities": 805, "entity": 805,
		"schemas": 808, "schema": 808, "database": 810, "db": 810, "storage": 815, "data": 820,
		"templates": 900, "template": 900, "layouts": 900, "layout": 900,
		"presenters": 905, "presenter": 905, "serializers": 910, "serializer": 910,
		"responses": 915, "response": 915, "formatters": 920, "formatter": 920,
		"components": 925, "component": 925, "ui": 925,
		"tests": 990, "test": 990, "__tests__": 990, "specs": 992, "spec": 992,
		"__specs__": 992, "e2e": 994, "unit": 996, "docs": 998, "documentation": 998,
		"examples": 999, "example": 999
	};

	function analyzeForKeywords(text) {
		var tokens = String(text).toLowerCase().split(/[\/\s]+/).map(function (t) {
			return t.replace(/[-_]/g, '');
		});
		var bestMatch = null, bestLength = 0;
		tokens.forEach(function (token) {
			if (LAYER_WEIGHTS[token] !== undefined) {
				var w = LAYER_WEIGHTS[token];
				if (bestMatch === null || w < bestMatch) { bestMatch = w; bestLength = token.length; }
				return;
			}
			Object.keys(LAYER_WEIGHTS).forEach(function (keyword) {
				if (token.indexOf(keyword) !== -1 && keyword.length > bestLength) {
					var kw = LAYER_WEIGHTS[keyword];
					if (bestMatch === null || kw < bestMatch) { bestMatch = kw; bestLength = keyword.length; }
				}
			});
		});
		return bestMatch !== null ? bestMatch : 9999;
	}

	function getLayerWeight(fullPath, folderName) {
		return Math.min(analyzeForKeywords(fullPath), analyzeForKeywords(folderName));
	}

	var sortedFolders = DATA.folders.slice().sort(function (a, b) {
		var wa = getLayerWeight(a.path, a.name), wb = getLayerWeight(b.path, b.name);
		if (wa !== wb) return wa - wb;
		return a.path.localeCompare(b.path);
	});

	var STATUS_ROW_CLASS = { added: 'status-added', deleted: 'status-deleted', modified: 'status-modified' };

	function rowsHtml(items, kind, classFlood) {
		var shown = items.slice(0, MAX_ROWS);
		var html = shown.map(function (it) {
			// A row's own changeStatus wins; otherwise it inherits the class-level
			// flood tint when the whole class was added/deleted (matches
			// classBoxRenderer.ts's sectionBgColor - "modified" classes only tint
			// the specific rows that changed, not everything in the box).
			var rowStatus = STATUS_ROW_CLASS[it.changeStatus] ? it.changeStatus : classFlood;
			var statusClass = STATUS_ROW_CLASS[rowStatus] ? ' ' + STATUS_ROW_CLASS[rowStatus] : '';
			if (kind === 'prop') {
				return '<div class="row' + statusClass + '"><span class="vis ' + it.visibility + '"></span>' +
					'<span class="rname">' + esc(it.name) + '</span><span class="rtype">: ' + esc(it.type || '') + '</span></div>';
			}
			var params = (it.params || []).join(', ');
			return '<div class="row' + statusClass + '"><span class="vis ' + it.visibility + '"></span>' +
				'<span class="rname">' + esc(it.name) + '</span><span class="rtype">(' + esc(params) + ')</span></div>';
		}).join('');
		if (items.length === 0) {
			html = '<div class="row empty">none</div>';
		} else if (items.length > MAX_ROWS) {
			html += '<div class="row more">+' + (items.length - MAX_ROWS) + ' more</div>';
		}
		return html;
	}

	var totalClasses = 0;
	sortedFolders.forEach(function (f) {
		var folderDiv = document.createElement('div');
		folderDiv.className = 'folder';

		var head = document.createElement('div');
		head.className = 'folder-head';
		head.innerHTML = '<span class="path">' + esc(f.path || '(root)') + '</span>' +
			'<span class="count">' + f.classes.length + '</span>';
		folderDiv.appendChild(head);

		var grid = document.createElement('div');
		grid.className = 'class-grid';

		f.classes.forEach(function (c) {
			totalClasses++;
			var box = document.createElement('div');
			var statusClass = c.changeStatus && c.changeStatus !== 'unchanged' ? ' status-' + c.changeStatus : '';
			box.className = 'class-box' + statusClass;
			box.dataset.id = c.id;

			var stereo = c.isInterface ? 'interface' : c.isAbstract ? 'abstract' : '';
			// A whole added/deleted class floods every row with its tint;
			// modified classes only tint the specific rows that changed.
			var classFlood = (c.changeStatus === 'added' || c.changeStatus === 'deleted') ? c.changeStatus : null;
			box.innerHTML =
				'<div class="head">' +
					(stereo ? '<div class="stereo">&laquo;' + stereo + '&raquo;</div>' : '') +
					'<div class="name">' + esc(c.name) + '</div>' +
				'</div>' +
				'<div class="section">' + rowsHtml(c.properties, 'prop', classFlood) + '</div>' +
				'<div class="section">' + rowsHtml(c.methods, 'method', classFlood) + '</div>';

			grid.appendChild(box);
		});

		folderDiv.appendChild(grid);
		foldersEl.appendChild(folderDiv);
	});

	setStats('class', DATA.folders.length + ' folders · ' + totalClasses + ' classes · ' + DATA.relationships.length + ' relationships');

	// UML convention (ported from classDiagramView.ts's client script): every
	// line is black, differentiated by marker shape and dash style rather
	// than color. Hollow triangle = inheritance/realization (extends,
	// implements); open arrow = dependency/association (everything else).
	// Dashed = implements/uses (a weaker, "depends on" coupling); solid =
	// everything else (a structural "has a" coupling).
	var HOLLOW_TRIANGLE_TYPES = { extends: true, implements: true };
	var DASHED_TYPES = { implements: true, uses: true };
	function markerIdFor(type) { return HOLLOW_TRIANGLE_TYPES[type] ? 'arrow-hollow' : 'arrow-open'; }

	// Find where the line from (cx,cy) toward (tx,ty) exits a w*h box
	// centered at (cx,cy) - ported from classDiagramView.ts's getBoxEdgePoint,
	// so lines terminate exactly at each box's border instead of its center.
	function getBoxEdgePoint(w, h, cx, cy, tx, ty) {
		var dx = tx - cx, dy = ty - cy;
		if (dx === 0 && dy === 0) return { x: cx, y: cy };
		var halfW = w / 2, halfH = h / 2;
		if (Math.abs(dx) * halfH > Math.abs(dy) * halfW) {
			return dx > 0
				? { x: cx + halfW, y: cy + (halfW * dy / dx) }
				: { x: cx - halfW, y: cy - (halfW * dy / dx) };
		}
		return dy > 0
			? { x: cx + (halfH * dx / dy), y: cy + halfH }
			: { x: cx - (halfH * dx / dy), y: cy - halfH };
	}

	function drawLines() {
		var worldRect = world.getBoundingClientRect();
		var scale = getScale();
		var boxes = {};
		document.querySelectorAll('.class-box').forEach(function (el) {
			var r = el.getBoundingClientRect();
			boxes[el.dataset.id] = {
				el: el,
				cx: (r.left - worldRect.left) / scale + r.width / scale / 2,
				cy: (r.top - worldRect.top) / scale + r.height / scale / 2,
				w: r.width / scale, h: r.height / scale
			};
		});

		var maxX = 0, maxY = 0;
		Object.keys(boxes).forEach(function (id) {
			maxX = Math.max(maxX, boxes[id].cx + boxes[id].w);
			maxY = Math.max(maxY, boxes[id].cy + boxes[id].h);
		});
		svg.setAttribute('width', maxX + 40);
		svg.setAttribute('height', maxY + 40);

		svg.innerHTML =
			'<defs>' +
			'<marker id="arrow-hollow" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto" markerUnits="userSpaceOnUse">' +
				'<polygon points="1,1 1,9 9,5" fill="var(--surface)" stroke="currentColor" stroke-width="1.3" stroke-linejoin="miter"/>' +
			'</marker>' +
			'<marker id="arrow-open" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto" markerUnits="userSpaceOnUse">' +
				'<polyline points="0,0 9,6 0,12" fill="none" stroke="currentColor" stroke-width="1.3"/>' +
			'</marker>' +
			'</defs>';

		// ===== Pass 1: raw box-edge-to-box-edge coordinates for every edge =====
		var rawLines = [];
		DATA.relationships.forEach(function (r, i) {
			var a = boxes[r.source], b = boxes[r.target];
			if (!a || !b || a === b) return;
			var start = getBoxEdgePoint(a.w, a.h, a.cx, a.cy, b.cx, b.cy);
			var end = getBoxEdgePoint(b.w, b.h, b.cx, b.cy, a.cx, a.cy);
			rawLines.push({ i: i, source: r.source, target: r.target, type: r.type, x1: start.x, y1: start.y, x2: end.x, y2: end.y });
		});

		// ===== Pass 2: detect lines that overlap and spread them apart =====
		// Ported from classDiagramView.ts: two segments count as overlapping
		// when they sit on (nearly) the same infinite line AND their
		// projections onto that line intersect - covers exact duplicate
		// source/target pairs as well as unrelated relationships that just
		// happen to line up. Works for any angle, not just horizontal/vertical.
		var GAP_TOLERANCE = 14, OFFSET_SPACING = 9;
		var lineMeta = rawLines.map(function (ln) {
			var dx = ln.x2 - ln.x1, dy = ln.y2 - ln.y1;
			var a = dy, b = -dx;
			var len = Math.hypot(a, b) || 1;
			a /= len; b /= len;
			var c = -(a * ln.x1 + b * ln.y1);
			if (a < 0 || (a === 0 && b < 0)) { a = -a; b = -b; c = -c; }
			var key = Math.round(a * 100) + ',' + Math.round(b * 100) + ',' + Math.round(c / 3);
			var dirX = -b, dirY = a;
			var t1 = ln.x1 * dirX + ln.y1 * dirY, t2 = ln.x2 * dirX + ln.y2 * dirY;
			var meta = {};
			for (var k in ln) meta[k] = ln[k];
			meta.a = a; meta.b = b; meta.key = key;
			meta.tmin = Math.min(t1, t2); meta.tmax = Math.max(t1, t2);
			return meta;
		});

		var groups = {};
		lineMeta.forEach(function (m, i) { (groups[m.key] = groups[m.key] || []).push(i); });
		var parent = lineMeta.map(function (_, i) { return i; });
		function find(i) { return parent[i] === i ? i : (parent[i] = find(parent[i])); }
		function union(i, j) { var ri = find(i), rj = find(j); if (ri !== rj) parent[ri] = rj; }
		Object.keys(groups).forEach(function (key) {
			var idx = groups[key];
			for (var i = 0; i < idx.length; i++) {
				for (var j = i + 1; j < idx.length; j++) {
					var li = lineMeta[idx[i]], lj = lineMeta[idx[j]];
					if (li.tmin - GAP_TOLERANCE <= lj.tmax && lj.tmin - GAP_TOLERANCE <= li.tmax) union(idx[i], idx[j]);
				}
			}
		});
		var clusters = {};
		lineMeta.forEach(function (m, i) { var r = find(i); (clusters[r] = clusters[r] || []).push(i); });
		Object.keys(clusters).forEach(function (root) {
			var members = clusters[root];
			if (members.length <= 1) return;
			members.sort(function (x, y) { return lineMeta[x].tmin - lineMeta[y].tmin || x - y; });
			var n = members.length;
			members.forEach(function (memberIndex, order) {
				var m = lineMeta[memberIndex];
				var offset = (order - (n - 1) / 2) * OFFSET_SPACING;
				m.x1 += m.a * offset; m.y1 += m.b * offset;
				m.x2 += m.a * offset; m.y2 += m.b * offset;
			});
		});

		// ===== Pass 3: draw the (possibly spread-out) straight lines =====
		var lines = [];
		lineMeta.forEach(function (m) {
			var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.classList.add('relationship-line');
			line.setAttribute('x1', m.x1); line.setAttribute('y1', m.y1);
			line.setAttribute('x2', m.x2); line.setAttribute('y2', m.y2);
			line.setAttribute('marker-end', 'url(#' + markerIdFor(m.type) + ')');
			line.dataset.source = m.source;
			line.dataset.target = m.target;
			line.dataset.dashed = DASHED_TYPES[m.type] ? '1' : '';
			svg.appendChild(line);
			lines.push(line);
		});

		// entrance animation: draw each line in, lightly staggered, then settle
		// into its real dash style (drawing the reveal itself with a dash
		// pattern would fight the reveal's own dasharray-as-progress trick)
		requestAnimationFrame(function () {
			lines.forEach(function (line, i) {
				var len = line.getTotalLength();
				line.style.strokeDasharray = len;
				line.style.strokeDashoffset = len;
				line.getBoundingClientRect();
				var delay = Math.min(i * 6, 500);
				line.style.transition = 'stroke-dashoffset 0.7s cubic-bezier(.2,.7,.3,1) ' + delay + 'ms';
				requestAnimationFrame(function () { line.style.strokeDashoffset = 0; });
				setTimeout(function () {
					line.style.transition = '';
					line.style.strokeDashoffset = '';
					line.style.strokeDasharray = line.dataset.dashed ? '4,3' : '';
				}, delay + 720);
			});
		});
	}

	// ---- hover highlight ----
	document.addEventListener('mouseover', function (e) {
		var box = e.target.closest('.class-box');
		if (!box) return;
		var id = box.dataset.id;
		var related = new Set([id]);
		svg.querySelectorAll('.relationship-line').forEach(function (ln) {
			if (ln.dataset.source === id || ln.dataset.target === id) {
				related.add(ln.dataset.source); related.add(ln.dataset.target);
			}
		});
		document.querySelectorAll('.class-box').forEach(function (b) {
			b.classList.toggle('hi', related.has(b.dataset.id));
			b.classList.toggle('dimmed', !related.has(b.dataset.id));
		});
		svg.querySelectorAll('.relationship-line').forEach(function (ln) {
			var hit = ln.dataset.source === id || ln.dataset.target === id;
			ln.classList.toggle('hi', hit);
			ln.classList.toggle('dimmed', !hit);
		});
	});
	document.addEventListener('mouseout', function (e) {
		if (!e.target.closest('.class-box')) return;
		if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.class-box')) return;
		document.querySelectorAll('.class-box').forEach(function (b) { b.classList.remove('hi', 'dimmed'); });
		svg.querySelectorAll('.relationship-line').forEach(function (ln) { ln.classList.remove('hi', 'dimmed'); });
	});

	// ---- zoom / pan ----
	var scale = 0.72, tx = 40, ty = 20;
	function getScale() { return scale; }
	function apply() { world.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')'; }

	viewport.addEventListener('wheel', function (e) {
		e.preventDefault();
		var prev = scale;
		scale = Math.max(0.25, Math.min(2, scale - e.deltaY * 0.0012));
		var rect = viewport.getBoundingClientRect();
		var mx = e.clientX - rect.left, my = e.clientY - rect.top;
		tx = mx - (mx - tx) * (scale / prev);
		ty = my - (my - ty) * (scale / prev);
		apply();
	}, { passive: false });

	var dragging = false, lastX = 0, lastY = 0;
	viewport.addEventListener('pointerdown', function (e) {
		if (e.target.closest('.class-box')) return;
		dragging = true; viewport.classList.add('panning'); lastX = e.clientX; lastY = e.clientY;
	});
	window.addEventListener('pointerup', function () { dragging = false; viewport.classList.remove('panning'); });
	window.addEventListener('pointermove', function (e) {
		if (!dragging) return;
		tx += e.clientX - lastX; ty += e.clientY - lastY;
		lastX = e.clientX; lastY = e.clientY;
		apply();
	});
	document.getElementById('zin').addEventListener('click', function () { scale = Math.min(2, scale + 0.15); apply(); });
	document.getElementById('zout').addEventListener('click', function () { scale = Math.max(0.25, scale - 0.15); apply(); });

	apply();
	requestAnimationFrame(function () {
		drawLines();
		requestAnimationFrame(function () { world.classList.remove('no-anim'); });
	});
	window.addEventListener('resize', drawLines);
	}
})();
