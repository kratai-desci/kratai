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

	function rowsHtml(items, kind) {
		var shown = items.slice(0, MAX_ROWS);
		var html = shown.map(function (it) {
			if (kind === 'prop') {
				return '<div class="row"><span class="vis ' + it.visibility + '"></span>' +
					'<span class="rname">' + esc(it.name) + '</span><span class="rtype">: ' + esc(it.type || '') + '</span></div>';
			}
			var params = (it.params || []).join(', ');
			return '<div class="row"><span class="vis ' + it.visibility + '"></span>' +
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
	DATA.folders.forEach(function (f) {
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
			box.innerHTML =
				'<div class="head">' +
					(stereo ? '<div class="stereo">&laquo;' + stereo + '&raquo;</div>' : '') +
					'<div class="name">' + esc(c.name) + '</div>' +
				'</div>' +
				'<div class="section">' + rowsHtml(c.properties, 'prop') + '</div>' +
				'<div class="section">' + rowsHtml(c.methods, 'method') + '</div>';

			grid.appendChild(box);
		});

		folderDiv.appendChild(grid);
		foldersEl.appendChild(folderDiv);
	});

	document.getElementById('stats').textContent =
		DATA.folders.length + ' folders · ' + totalClasses + ' classes · ' + DATA.relationships.length + ' relationships';

	var TYPE_COLOR = { extends: 'var(--accent)', implements: 'var(--accent)' };
	var TYPE_DASH = { implements: '5,4', uses: '3,4', imports: '3,4' };
	function colorFor(type) { return TYPE_COLOR[type] || (isCallLike(type) ? 'var(--accent-2)' : 'var(--text-faint)'); }
	function isCallLike(type) { return /^(calls|async-calls|creates)/.test(type); }

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
			'<marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity="0.8"/></marker>' +
			'</defs>';

		var paths = [];
		DATA.relationships.forEach(function (r, i) {
			var a = boxes[r.source], b = boxes[r.target];
			if (!a || !b || a === b) return;

			var dx = b.cx - a.cx, dy = b.cy - a.cy;
			var dist = Math.hypot(dx, dy) || 1;
			var nx = -dy / dist, ny = dx / dist;
			var bow = Math.min(60, dist * 0.18) * (i % 2 === 0 ? 1 : -1);
			var mx = (a.cx + b.cx) / 2 + nx * bow;
			var my = (a.cy + b.cy) / 2 + ny * bow;

			var d = 'M ' + a.cx + ',' + a.cy + ' Q ' + mx + ',' + my + ' ' + b.cx + ',' + b.cy;
			var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			path.setAttribute('d', d);
			path.setAttribute('fill', 'none');
			path.setAttribute('stroke', colorFor(r.type));
			path.setAttribute('stroke-width', isCallLike(r.type) ? 1.1 : 1.4);
			path.setAttribute('color', colorFor(r.type));
			if (TYPE_DASH[r.type]) path.setAttribute('stroke-dasharray', TYPE_DASH[r.type]);
			path.setAttribute('marker-end', 'url(#arrow)');
			path.dataset.source = r.source;
			path.dataset.target = r.target;
			svg.appendChild(path);
			paths.push(path);
		});

		// entrance animation: draw each path in, lightly staggered
		requestAnimationFrame(function () {
			paths.forEach(function (p, i) {
				var len = p.getTotalLength();
				p.style.strokeDasharray = (TYPE_DASH[p.dataset.type] ? TYPE_DASH[p.dataset.type] + ',' : '') + len;
				p.style.strokeDashoffset = len;
				p.getBoundingClientRect();
				p.style.transition = 'stroke-dashoffset 0.7s cubic-bezier(.2,.7,.3,1) ' + Math.min(i * 6, 500) + 'ms';
				requestAnimationFrame(function () { p.style.strokeDashoffset = 0; });
			});
		});
	}

	// ---- hover highlight ----
	document.addEventListener('mouseover', function (e) {
		var box = e.target.closest('.class-box');
		if (!box) return;
		var id = box.dataset.id;
		var related = new Set([id]);
		svg.querySelectorAll('path').forEach(function (p) {
			if (p.dataset.source === id || p.dataset.target === id) {
				related.add(p.dataset.source); related.add(p.dataset.target);
			}
		});
		document.querySelectorAll('.class-box').forEach(function (b) {
			b.classList.toggle('hi', related.has(b.dataset.id));
			b.classList.toggle('dimmed', !related.has(b.dataset.id));
		});
		svg.querySelectorAll('path').forEach(function (p) {
			var hit = p.dataset.source === id || p.dataset.target === id;
			p.classList.toggle('hi', hit);
			p.classList.toggle('dimmed', !hit);
		});
	});
	document.addEventListener('mouseout', function (e) {
		if (!e.target.closest('.class-box')) return;
		if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.class-box')) return;
		document.querySelectorAll('.class-box').forEach(function (b) { b.classList.remove('hi', 'dimmed'); });
		svg.querySelectorAll('path').forEach(function (p) { p.classList.remove('hi', 'dimmed'); });
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
