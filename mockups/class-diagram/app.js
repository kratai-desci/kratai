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

	document.getElementById('stats').textContent =
		DATA.folders.length + ' folders · ' + totalClasses + ' classes · ' + DATA.relationships.length + ' relationships';

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
