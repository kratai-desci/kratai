/**
 * The folder tree panel (drill-down chevrons, eye show/hide, hamburger
 * drag-reorder) shared between kratai view's class diagram and its stack
 * layer - built for the class diagram specifically. A collapsed group
 * behaves the same way it does in the 3D stack: every class in that
 * folder and its subfolders collapses down into one combined layer, and
 * expanding it is what breaks that back down into the real per-folder
 * boxes - so this script computes a "plan" (which real folders currently
 * stand alone vs. which are merged into which collapsed group) and hands
 * it to the page via `applyFolderPlan`, rather than just toggling
 * display on the already-rendered boxes.
 *
 * The two call sites - classDiagramView.ts today, maybe stackLayerView.ts's
 * own panel later - provide the page-specific pieces: CSS positioning (via
 * generateFolderPanelCSS) and two global functions this script calls
 * (applyFolderPlan, highlightFolderPaths).
 */

export interface FolderPanelPosition {
	position: 'fixed' | 'absolute';
	top: string;
	left: string;
}

export function generateFolderPanelCSS(pos: FolderPanelPosition): string {
	return `
	#folder-panel-toggle-wrap {
		position: ${pos.position}; top: ${pos.top}; left: ${pos.left}; z-index: 900;
		display: flex; flex-direction: row; align-items: flex-start; gap: 10px;
	}
	#folder-panel-toggle {
		width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border);
		background: var(--surface);
		background: color-mix(in srgb, var(--surface) 90%, transparent);
		color: var(--text); font-size: 15px; cursor: pointer; backdrop-filter: blur(10px);
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
	}
	#folder-panel-toggle:hover { border-color: var(--accent); color: var(--accent); }
	#folder-panel-toggle.active { border-color: var(--accent); color: var(--accent); }
	#folder-panel {
		display: flex; flex-direction: column; gap: 1px;
		width: 240px;
		max-height: calc(100vh - ${pos.top} - 16px);
		overflow-y: auto;
		background: color-mix(in srgb, var(--surface) 92%, transparent);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 6px;
		backdrop-filter: blur(10px);
	}
	#folder-panel.closed { display: none; }
	.fp-row {
		display: flex; flex-direction: row; align-items: baseline;
		gap: 6px; padding: 5px 8px; border-radius: 7px;
		white-space: nowrap; overflow: hidden; line-height: 1.2;
		transition: background 0.15s ease;
	}
	.fp-row:hover { background: color-mix(in srgb, var(--accent) 10%, transparent); }
	.fp-label {
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 10.5px; font-weight: 650; color: var(--text);
		overflow: hidden; text-overflow: ellipsis;
	}
	.fp-count {
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 9px; color: var(--text-dim); opacity: 0.8;
		margin-left: auto; flex-shrink: 0;
	}
	.fp-chevron {
		width: 12px; height: 12px; flex-shrink: 0;
		display: flex; align-items: center; justify-content: center;
		color: var(--text-faint);
	}
	.fp-chevron svg { width: 11px; height: 11px; transition: transform 0.15s ease; }
	.fp-chevron.expanded svg { transform: rotate(90deg); }
	.fp-row.drillable { cursor: pointer; }
	.fp-row.drillable .fp-label { font-weight: 800; }
	.fp-vis {
		width: 18px; height: 18px; flex-shrink: 0; margin-left: 4px;
		display: flex; align-items: center; justify-content: center;
		border-radius: 5px; color: var(--text-faint); cursor: pointer;
	}
	.fp-vis svg { width: 12px; height: 12px; }
	.fp-vis:hover { color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
	.fp-drag {
		width: 16px; height: 18px; flex-shrink: 0;
		display: flex; align-items: center; justify-content: center;
		color: var(--text-faint);
	}
	.fp-drag[draggable] { cursor: grab; }
	.fp-drag[draggable]:hover { color: var(--accent); }
	.fp-drag[draggable]:active { cursor: grabbing; }
	.fp-drag svg { width: 12px; height: 12px; }
	.fp-row.drag-over { box-shadow: inset 0 2px 0 var(--accent); }
	.folder-container.folder-highlighted { border-color: var(--accent); }
`;
}

export function generateFolderPanelScript(): string {
	return `
(function () {
	'use strict';

	var EYE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
	var EYE_OFF_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.8 21.8 0 0 1-3.22 4.36M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
	var HAMBURGER_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>';
	var CHEVRON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 5 16 12 9 19"/></svg>';
	var FOLDER_SVG = '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M1,3.5 h4 l1.2,1.5 h6.3 v6.5 h-11.5 z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
	var SELF_SUFFIX = '::self';

	// ---- read the already-rendered leaf-folder boxes, in the order the
	// server sorted them (custom order, then alphabetical - see
	// folderBoxRenderer.ts), instead of fetching a separate data blob -
	// the DOM is already the source of truth for what's rendered. ----
	var boxes = document.querySelectorAll('.folder-container[data-folder]');
	if (!boxes.length) return;

	var leaves = [];
	var hiddenNodes = {};
	boxes.forEach(function (el) {
		var p = el.getAttribute('data-folder');
		var nameEl = el.querySelector('.folder-name');
		leaves.push({ path: p, name: nameEl ? nameEl.textContent : p });
		if (el.getAttribute('data-hidden') === 'true') hiddenNodes[p] = true;
	});

	var originalRank = {};
	leaves.forEach(function (f, i) { originalRank[f.path] = i; });

	// ---- same compressed-tree idea as stackLayerView.ts's buildLayerTree:
	// group by shared path prefix, then collapse any chain that never
	// branches, so a group only exists where two or more real folders
	// actually diverge. ----
	function buildTree(items) {
		var root = { path: '', name: '', children: [], leaf: null };
		items.forEach(function (leaf) {
			var segs = leaf.path.split('/');
			var node = root, acc = '';
			segs.forEach(function (seg, idx) {
				acc = acc ? acc + '/' + seg : seg;
				var child = null;
				for (var i = 0; i < node.children.length; i++) {
					if (node.children[i].path === acc) { child = node.children[i]; break; }
				}
				if (!child) {
					child = { path: acc, name: seg || 'workspace', children: [], leaf: null };
					node.children.push(child);
				}
				node = child;
				if (idx === segs.length - 1) node.leaf = leaf;
			});
		});
		function compress(node) {
			node.children = node.children.map(compress);
			while (!node.leaf && node.children.length === 1) node = node.children[0];
			return node;
		}
		root.children = root.children.map(compress);
		function aggregate(node) {
			var leafCount = node.leaf ? 1 : 0;
			node.children.forEach(function (c) { aggregate(c); leafCount += c._aggLeafCount; });
			node._aggLeafCount = leafCount;
		}
		root.children.forEach(aggregate);
		return root;
	}
	var tree = buildTree(leaves);

	function collectLeafPaths(node, out) {
		if (node.leaf) out.push(node.path);
		node.children.forEach(function (c) { collectLeafPaths(c, out); });
	}

	// Whichever path(s) currently have a *visible* box representing this
	// node, for hover highlighting - itself, whether it's a leaf or a
	// currently-collapsed group (collapsed, it's one merged box keyed by
	// its own path - see applyFolderPlan); an *expanded* group has no box
	// of its own, so this recurses into whatever currently represents
	// each of its children instead.
	function currentRepresentationPaths(node) {
		if (!node.children.length || !expandedGroups[node.path]) return [node.path];
		var out = [];
		if (node.leaf) out.push(node.path);
		node.children.forEach(function (c) { out = out.concat(currentRepresentationPaths(c)); });
		return out;
	}

	// ---- persistence: same /api/* endpoints the stack layer already
	// writes to, so a change made from either panel is remembered the
	// same way. ----
	var ORDER_BUCKET = 100000;
	function persistOrderFor(siblings) {
		var orders = {};
		siblings.forEach(function (sib, i) {
			var leafPaths = [];
			collectLeafPaths(sib, leafPaths);
			leafPaths.forEach(function (p) { orders[p] = i * ORDER_BUCKET + (originalRank[p] || 0); });
		});
		fetch('/api/folder-order', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ orders: orders })
		}).catch(function () {});
	}
	function persistVisibility(key, hidden) {
		fetch('/api/folder-visibility', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path: key, hidden: hidden })
		}).catch(function () {});
	}

	// ---- apply to the canvas: recompute the full plan from scratch every
	// time (which real folders stand alone, which are merged into which
	// collapsed group, what's hidden, in what order) and hand it to the
	// page-specific apply function, rather than trying to patch just what
	// changed - simple and correct, and cheap enough at this scale (dozens
	// of folders, not thousands).
	//
	// A collapsed group produces one 'merged' plan entry carrying every
	// real leaf path folded into it (mirrors stackLayerView.ts's own
	// collapsed-group aggregate, just without the 3D sizing). An expanded
	// group produces no entry of its own - only its real children (and its
	// own leaf, if it has one) do, each a standalone 'leaf' entry. ----
	function applyState() {
		var plan = [];
		function walk(node, ancestorHidden) {
			if (!node.children.length) {
				plan.push({ type: 'leaf', path: node.path, hidden: ancestorHidden || !!hiddenNodes[node.path] });
				return;
			}
			if (!expandedGroups[node.path]) {
				var realPaths = [];
				collectLeafPaths(node, realPaths);
				plan.push({
					type: 'merged', path: node.path, name: node.name, realPaths: realPaths,
					hidden: ancestorHidden || !!hiddenNodes[node.path]
				});
				return;
			}
			var nextAncestorHidden = ancestorHidden || !!hiddenNodes[node.path];
			if (node.leaf) {
				plan.push({ type: 'leaf', path: node.path, hidden: nextAncestorHidden || !!hiddenNodes[node.path + SELF_SUFFIX] });
			}
			node.children.forEach(function (c) { walk(c, nextAncestorHidden); });
		}
		tree.children.forEach(function (c) { walk(c, false); });
		if (window.applyFolderPlan) window.applyFolderPlan(plan);
	}

	var dragSource = null;
	var expandedGroups = {};
	(window.FOLDER_PANEL_INITIAL_EXPANDED || []).forEach(function (p) { expandedGroups[p] = true; });

	var toggleBtn = document.createElement('button');
	toggleBtn.id = 'folder-panel-toggle';
	toggleBtn.className = 'active';
	toggleBtn.title = 'Hide folder list';
	toggleBtn.innerHTML = FOLDER_SVG;

	var panel = document.createElement('div');
	panel.id = 'folder-panel';

	var wrap = document.createElement('div');
	wrap.id = 'folder-panel-toggle-wrap';
	wrap.appendChild(toggleBtn);
	wrap.appendChild(panel);
	document.body.appendChild(wrap);

	toggleBtn.addEventListener('click', function () {
		var hidden = panel.classList.toggle('closed');
		toggleBtn.classList.toggle('active', !hidden);
	});

	function renderRow(node, depth, ancestorHidden, siblings, index) {
		var isGroup = node.children.length > 0;
		var hideKey = node.isSelf ? (node.path + SELF_SUFFIX) : node.path;
		var ownHidden = !!hiddenNodes[hideKey];
		var effectivelyHidden = ancestorHidden || ownHidden;

		var row = document.createElement('div');
		row.className = 'fp-row' + (isGroup ? ' drillable' : '');
		row.style.paddingLeft = (4 + depth * 14) + 'px';
		row.style.opacity = effectivelyHidden ? '0.35' : '1';
		row.title = node.path;

		function highlight(on) {
			currentRepresentationPaths(node).forEach(function (p) {
				if (window.highlightFolderPaths) window.highlightFolderPaths([p], on);
			});
		}
		row.addEventListener('mouseenter', function () { highlight(true); });
		row.addEventListener('mouseleave', function () { highlight(false); });
		if (isGroup) {
			row.addEventListener('click', function () {
				var nowExpanded = !expandedGroups[node.path];
				expandedGroups[node.path] = nowExpanded;
				renderPanel();
				applyState();
				fetch('/api/folder-expanded', {
					method: 'POST', headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ path: node.path, expanded: nowExpanded })
				}).catch(function () {});
			});
		}

		var drag = document.createElement('div');
		drag.className = 'fp-drag';
		if (siblings) {
			drag.innerHTML = HAMBURGER_SVG;
			drag.title = 'Drag to reorder';
			drag.draggable = true;
			drag.addEventListener('click', function (e) { e.stopPropagation(); });
			drag.addEventListener('dragstart', function (e) {
				e.stopPropagation();
				dragSource = { siblings: siblings, index: index };
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', node.path);
				try { e.dataTransfer.setDragImage(row, 14, 14); } catch (err) { /* not all browsers support a custom drag image */ }
			});
			drag.addEventListener('dragend', function () {
				dragSource = null;
				var overRows = panel.querySelectorAll('.drag-over');
				for (var i = 0; i < overRows.length; i++) overRows[i].classList.remove('drag-over');
			});
			row.addEventListener('dragover', function (e) {
				if (!dragSource || dragSource.siblings !== siblings) return;
				e.preventDefault();
				e.dataTransfer.dropEffect = 'move';
				row.classList.add('drag-over');
			});
			row.addEventListener('dragleave', function () { row.classList.remove('drag-over'); });
			row.addEventListener('drop', function (e) {
				if (!dragSource || dragSource.siblings !== siblings) return;
				e.preventDefault();
				row.classList.remove('drag-over');
				var from = dragSource.index, to = index;
				dragSource = null;
				if (from === to) return;
				var moved = siblings.splice(from, 1)[0];
				siblings.splice(to, 0, moved);
				persistOrderFor(siblings);
				renderPanel();
				applyState();
			});
		}
		row.appendChild(drag);

		var chevron = document.createElement('div');
		chevron.className = 'fp-chevron' + (isGroup && expandedGroups[node.path] ? ' expanded' : '');
		chevron.innerHTML = isGroup ? CHEVRON_SVG : '';
		row.appendChild(chevron);

		var label = document.createElement('div');
		label.className = 'fp-label';
		label.textContent = node.name;
		row.appendChild(label);

		var count = document.createElement('div');
		count.className = 'fp-count';
		count.textContent = isGroup
			? (node._aggLeafCount + (node._aggLeafCount === 1 ? ' layer' : ' layers'))
			: '';
		row.appendChild(count);

		var vis = document.createElement('div');
		vis.className = 'fp-vis';
		vis.innerHTML = ownHidden ? EYE_OFF_SVG : EYE_SVG;
		vis.title = ownHidden ? 'Show in diagram' : 'Hide from diagram';
		vis.addEventListener('click', function (e) {
			e.stopPropagation();
			var nowHidden = !hiddenNodes[hideKey];
			hiddenNodes[hideKey] = nowHidden;
			renderPanel();
			applyState();
			persistVisibility(hideKey, nowHidden);
		});
		row.appendChild(vis);

		panel.appendChild(row);

		if (isGroup && expandedGroups[node.path]) {
			if (node.leaf) renderRow({ path: node.path, name: node.name, children: [], leaf: node.leaf, isSelf: true }, depth + 1, effectivelyHidden, null, -1);
			node.children.forEach(function (c, idx) { renderRow(c, depth + 1, effectivelyHidden, node.children, idx); });
		}
	}

	function renderPanel() {
		panel.innerHTML = '';
		tree.children.forEach(function (c, idx) { renderRow(c, 0, false, tree.children, idx); });
	}

	renderPanel();
	applyState();
})();
`;
}
