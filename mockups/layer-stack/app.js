(function () {
	'use strict';
	try {
	run();
	} catch (err) {
		var box = document.getElementById('errbox');
		var msg = document.getElementById('errmsg');
		if (box && msg) {
			msg.textContent = (err && err.message) ? err.message : String(err);
			box.style.display = 'block';
		}
		console.error('[kratai mockup]', err);
	}

	function run() {
	var DATA = /*__DATA__*/ null;

	var LAYER_GAP = 13;    // vertical distance between sheets
	var MIN_SIZE = 100, SIZE_PER_CLASS = 16, MAX_SIZE = 220;
	var LABEL_OFFSET_X = 88;
	var INDENT_STEP_X = 22;    // per-depth-level rightward shift, folder-tree style
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

	// ---- build the full folder tree once, with recursive (self + all
	// descendants) class count and average layer weight cached per node ----
	var root = { path: '', children: {}, ownClassCount: 0, ownWeightSum: 0, ownWeightN: 0 };
	DATA.folders.forEach(function (f) {
		var parts = f.path.split('/');
		var node = root;
		var acc = [];
		parts.forEach(function (seg) {
			acc.push(seg);
			var p = acc.join('/');
			if (!node.children[seg]) node.children[seg] = { path: p, children: {}, ownClassCount: 0, ownWeightSum: 0, ownWeightN: 0 };
			node = node.children[seg];
		});
		node.ownClassCount += f.classes.length;
		node.ownWeightSum += f.layerWeight;
		node.ownWeightN += 1;
	});
	(function computeAgg(node) {
		var classCount = node.ownClassCount, weightSum = node.ownWeightSum, weightN = node.ownWeightN;
		Object.keys(node.children).forEach(function (k) {
			var c = node.children[k];
			computeAgg(c);
			classCount += c._classCount;
			weightSum += c._weightSum;
			weightN += c._weightN;
		});
		node._classCount = classCount;
		node._weightSum = weightSum;
		node._weightN = weightN || 1;
		node._avgWeight = weightSum / node._weightN;
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
				inner.push(child); // header always tops its own block
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

	// HUD layer for labels: plain absolutely-positioned DOM, not a 3D object -
	// each frame we project each sheet's height onto the screen and place the
	// label there directly, so it's a flat overlay (fixed font size, no
	// perspective scaling) that never spins or tilts with the model.
	var hud = document.createElement('div');
	hud.id = 'hud';
	stage.appendChild(hud);

	var rigGL = new THREE.Group(); sceneGL.add(rigGL);
	sceneGL.add(new THREE.AmbientLight(0xffffff, 0.75));
	var dl = new THREE.DirectionalLight(0xffffff, 0.9);
	dl.position.set(300, 500, 400);
	sceneGL.add(dl);

	var collapseAllBtn = document.getElementById('collapse-all');
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
			node._y = (i - (n - 1) / 2) * LAYER_GAP;
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
		while (hud.firstChild) hud.removeChild(hud.firstChild);

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

			var drillable = hasKids(node) && !node._isHeader;
			var face = document.createElement('div');
			face.className = 'slab-face'
				+ (node._isHeader ? ' header' : (drillable ? ' drillable' : ' leaf'))
				+ (node._isSelf ? ' self' : '');

			// tint by tree depth, not expand-state: a header sits at its own
			// natural depth and stays the same plain white whether expanded
			// or not, while its indented children shift a touch darker per
			// nesting level - the color reflects where you are in the tree,
			// not whether you clicked something
			if (node._indent > 0) {
				var darken = Math.min(30, node._indent * 10);
				face.style.background = 'color-mix(in srgb, black ' + darken + '%, var(--surface))';
			}

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

			hud.appendChild(face);
			node._labelEl = face;

			if (isNew && !origin && !reduceMotion) {
				// no parent header to slide out from (e.g. first render) -
				// fall back to a simple grow/fade in place
				face.style.opacity = '0';
				face.style.transform = 'translateY(-50%) scale(0.6)';
				requestAnimationFrame(function () {
					face.style.transition = 'opacity 0.32s ease-out, transform 0.32s cubic-bezier(0.2,0.8,0.3,1.4)';
					face.style.opacity = '1';
					face.style.transform = 'translateY(-50%) scale(1)';
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
		document.getElementById('stats').textContent =
			n + (n === 1 ? ' folder' : ' folders') + ' visible · ' + totalClasses + ' classes · ' +
			lines.length + (lines.length === 1 ? ' relationship' : ' relationships');

		if (collapseAllBtn) collapseAllBtn.style.display = Object.keys(expanded).length ? 'inline-block' : 'none';
	}

	if (collapseAllBtn) {
		collapseAllBtn.addEventListener('click', function () { expanded = {}; renderTree(); });
	}

	function updateHud() {
		var w = stage.clientWidth, h = stage.clientHeight;
		var v = new THREE.Vector3();
		visibleNodes.forEach(function (node) {
			v.set(0, node._animY, 0).project(camera);
			var px = (v.x * 0.5 + 0.5) * w;
			var py = (-v.y * 0.5 + 0.5) * h;
			node._labelEl.style.left = (px + LABEL_OFFSET_X + node._indent * INDENT_STEP_X) + 'px';
			node._labelEl.style.top = py + 'px';
		});
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
		if (autoRotate) rotY += 0.0014;
		applyRig();
		updateHud();
		stepTweens();
		rendererGL.render(sceneGL, camera);
		requestAnimationFrame(tick);
	}
	requestAnimationFrame(tick);
	}
})();
