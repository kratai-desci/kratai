import { ReactFlowNode, ReactFlowEdge, FolderStructureBuilder, KrataiConfig } from '@kratai/core';
import { FolderBoxRenderer } from './components/folderBoxRenderer';
import { generateFolderPanelCSS, generateFolderPanelScript } from './folderPanelScript';

export class ClassDiagramView {
	
	/**
	 * hasLiveHost gates every affordance that needs something on the other
	 * end of postMessage to act on it: the Save as MD / Settings header
	 * buttons, the per-class "open file" hover button, and click-to-open on
	 * property/method rows. Without a live host (e.g. a standalone HTML file
	 * opened directly - no listening parent frame) those would be dead
	 * clicks, so default is false - a caller that forgets to pass this gets
	 * the safe behavior rather than a diagram full of buttons that silently
	 * do nothing. Zoom/pan/focus-highlight/relationship-line layout stay
	 * always-on regardless - pure client-side rendering, no host needed, so
	 * every outlet looks and behaves the same.
	 */
	static generate(
		nodes: ReactFlowNode[],
		edges: ReactFlowEdge[],
		workspaceName: string,
		config: KrataiConfig,
		iconUri?: string,
		hasLiveHost?: boolean
	): string {
		// Step 1: Build folder structure
		const root = FolderStructureBuilder.build(nodes);
		console.log('=== Folder Structure (Flat Layout with Custom Order) ===');
		FolderStructureBuilder.logStructure(root);
		console.log(`\n📊 Total: ${nodes.length} classes, ${FolderStructureBuilder.countFolders(root)} folders`);

		// Step 2: Render with flat layout and custom folder ordering
		const folderRenderer = new FolderBoxRenderer(config, hasLiveHost);
		const folderHTML = folderRenderer.renderAll(root);

		console.log(`\n✅ Generated HTML with flat folder layout`);
		console.log(`📝 All ${nodes.length} classes rendered in ordered flat containers`);
		console.log(`🔗 ${edges.length} relationships will be drawn as lines`);
		
		// Real group paths with expanded set in config - seeds the folder
		// panel's expandedGroups on load (see folderPanelScript.ts), same
		// idea as stackLayerData.ts's initialExpanded for the stack layer.
		const initialExpanded = Object.entries(config.folders || {})
			.filter(([, folderConfig]) => folderConfig.expanded)
			.map(([folderPath]) => folderPath);
		// Shared with the stack layer's own panel toggle (config.folderPanelOpen).
		const initialPanelOpen = config.folderPanelOpen !== false;

		// Step 3: Generate final HTML with relationship data
		return this.generateHTML(
			workspaceName,
			nodes.length,
			edges.length,
			FolderStructureBuilder.countFolders(root),
			folderHTML,
			edges,
			initialExpanded,
			initialPanelOpen,
			iconUri,
			hasLiveHost
		);
	}

	private static generateHTML(
		workspaceName: string,
		classCount: number,
		edgeCount: number,
		folderCount: number,
		folderHTML: string,
		edges: ReactFlowEdge[],
		initialExpanded: string[],
		initialPanelOpen: boolean,
		iconUri?: string,
		hasLiveHost?: boolean
	): string {
		// Properly encode edges for JavaScript embedding
		const edgesJSON = JSON.stringify(edges)
			.replace(/\\/g, '\\\\')
			.replace(/'/g, "\\'");
		
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hierarchical Class Diagram (CSS Grid)</title>
    <script>
        // Runs before first paint to avoid a flash of the wrong theme.
        // localStorage is shared with the shell/other views (same origin),
        // so a choice made anywhere (see viewShell.ts's theme-toggle button)
        // applies here too, even when this page is opened on its own.
        try {
            var krataiTheme = localStorage.getItem('kratai-theme');
            if (krataiTheme) document.documentElement.setAttribute('data-theme', krataiTheme);
        } catch (e) {}
    </script>
    <style>
        :root {
            --bg: #EEF2FA;
            --surface: #FFFFFF;
            --surface-2: #F4F7FD;
            --text: #17203A;
            --text-dim: #5C6785;
            --text-faint: #94A0BE;
            --border: #DCE3F2;
            --accent: #3459E0;
            --accent-2: #14A6B8;
            --glow: rgba(52, 89, 224, 0.30);
            --added: #1E9E5A;
            --added-bg: rgba(30, 158, 90, 0.10);
            --deleted: #D6455B;
            --deleted-bg: rgba(214, 69, 91, 0.10);
            --modified: #C98A1B;
            --modified-bg: rgba(201, 138, 27, 0.12);
        }
        @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) {
                --bg: #0A0E19;
                --surface: #131A2E;
                --surface-2: #171F38;
                --text: #E8ECFB;
                --text-dim: #939CBE;
                --text-faint: #5B6488;
                --border: #262E4E;
                --accent: #6D93F5;
                --accent-2: #4FDCEA;
                --glow: rgba(109, 147, 245, 0.38);
                --added: #4ADE94;
                --added-bg: rgba(74, 222, 148, 0.10);
                --deleted: #F0728A;
                --deleted-bg: rgba(240, 114, 138, 0.12);
                --modified: #F0C05A;
                --modified-bg: rgba(240, 192, 90, 0.12);
            }
        }
        :root[data-theme="dark"] {
            --bg: #0A0E19; --surface: #131A2E; --surface-2: #171F38;
            --text: #E8ECFB; --text-dim: #939CBE; --text-faint: #5B6488; --border: #262E4E;
            --accent: #6D93F5; --accent-2: #4FDCEA; --glow: rgba(109, 147, 245, 0.38);
            --added: #4ADE94; --added-bg: rgba(74, 222, 148, 0.10);
            --deleted: #F0728A; --deleted-bg: rgba(240, 114, 138, 0.12);
            --modified: #F0C05A; --modified-bg: rgba(240, 192, 90, 0.12);
        }
        * { box-sizing: border-box; }
        html, body { height: 100%; }
        body {
            margin: 0;
            padding: 0;
            font-family: ui-sans-serif, -apple-system, 'Segoe UI', system-ui, sans-serif;
            background: var(--bg);
            background-image: radial-gradient(color-mix(in srgb, var(--border) 70%, transparent) 1px, transparent 1px);
            background-size: 22px 22px;
            color: var(--text);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .header {
            flex-shrink: 0;
            background: var(--surface);
            padding: 14px 20px;
            border-bottom: 1px solid var(--border);
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header-title { display: flex; align-items: center; gap: 16px; }
        .header-controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .header-controls button {
            padding: 7px 14px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            border-radius: 8px;
            cursor: pointer;
            font-size: 12.5px;
            font-weight: 550;
            transition: border-color 0.15s ease, color 0.15s ease;
        }
        .header-controls button:hover {
            border-color: var(--accent);
            color: var(--accent);
        }
        .header-controls .settings-btn {
            border-color: var(--accent-2);
            color: var(--accent-2);
        }
        .header-controls .settings-btn:hover {
            background: var(--surface-2);
        }
        .header h1 {
            margin: 0;
            font-size: 15px;
            color: var(--text);
            font-weight: 650;
        }
        .header p {
            margin: 3px 0 0 0;
            color: var(--text-dim);
            font-size: 12.5px;
            font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
            font-variant-numeric: tabular-nums;
        }
        .uml-box {
            cursor: pointer;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            box-shadow: 0 1px 2px rgba(10, 14, 25, 0.06);
            font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
            font-size: 12px;
            position: relative;
            z-index: 10;
            overflow: hidden;
            transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, opacity 0.25s ease;
        }
        .uml-box::before {
            content: '';
            position: absolute; top: 0; left: 0; right: 0; height: 3px;
            background: var(--accent);
        }
        .uml-box.change-added::before { background: var(--added); }
        .uml-box.change-deleted::before { background: var(--deleted); }
        .uml-box.change-modified::before { background: var(--modified); }
        .uml-box.change-added .box-name { color: var(--added); }
        .uml-box.change-deleted .box-name { color: var(--deleted); text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--deleted) 50%, transparent); }
        .uml-box.change-modified .box-name { color: var(--modified); }
        .uml-box:hover {
            transform: translateY(-2px);
            border-color: var(--accent);
            box-shadow: 0 8px 20px var(--glow);
        }
        .box-header {
            padding: 10px 12px 8px;
            border-bottom: 1px solid var(--border);
        }
        .box-header .stereo {
            font-size: 9.5px; font-weight: 650; letter-spacing: 0.05em; text-transform: uppercase;
            color: var(--accent-2); margin-bottom: 2px;
        }
        .box-header .box-name { font-size: 13px; font-weight: 650; color: var(--text); }
        .diagram-container {
            position: relative;
            flex: 1;
            min-height: 0;
            padding: 28px;
            max-width: 100%;
            overflow: auto;
            background-image: radial-gradient(color-mix(in srgb, var(--border) 70%, transparent) 1px, transparent 1px);
            background-size: 22px 22px;
        }
        /* #diagram-world is the zoomable "world" - it holds the folder/class
           content and gets the scale transform. #diagram (.diagram-container)
           stays the fixed, unscaled, scrollable viewport around it, so
           zooming out actually shrinks the world within a stable frame
           (revealing more of it) instead of shrinking the frame itself. */
        #diagram-world {
            transform-origin: top left;
        }
        #relationship-svg {
            /* No width/height here - JS sets those as attributes, sized to
               the full scrollable content (container.scrollWidth/Height),
               not just the visible viewport. A CSS width/height would win
               over those attributes and cap the SVG's own box (which
               defaults to overflow:hidden as the root <svg>) at the visible
               viewport size, silently clipping any line drawn below/right
               of whatever was visible at draw time. */
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 5;
            color: var(--text);
        }
        /* Deliberately no z-index/backdrop-filter on .folder-container - either
           would force a new stacking context, trapping .uml-box's z-index
           inside a losing sub-context that can never out-rank
           #relationship-svg's z-index 5 despite the higher number (this exact
           bug already happened once, in the layer-stack mockup). Plain
           position:relative alone is safe - it only becomes a problem
           combined with z-index or other stacking-context triggers like
           backdrop-filter/opacity/transform. */
        .folder-container {
            position: relative;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 16px 18px 20px;
            margin: 0 0 24px;
        }
        .folder-header {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border);
        }
        .folder-header .folder-name { font-size: 13px; font-weight: 650; color: var(--text); }
        .folder-header .folder-path {
            font-size: 11.5px; color: var(--text-faint);
            font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
        }
        .folder-header .folder-count {
            margin-left: auto;
            font-size: 10.5px; color: var(--text-faint);
            background: var(--surface-2); border-radius: 100px; padding: 2px 9px;
            font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
        }
        .classes-grid { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-start; }

        .section { border-top: 1px solid var(--border); padding: 6px 0; }
        .section:first-child { border-top: none; }
        .member-item {
            display: flex; align-items: baseline; gap: 6px;
            padding: 2.5px 12px; font-size: 10.5px;
            white-space: nowrap; overflow: hidden;
        }
        .member-item .vis { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .vis.public { background: var(--accent-2); }
        .vis.private { background: var(--deleted); opacity: 0.75; }
        .vis.protected { background: var(--modified); opacity: 0.85; }
        .member-item .rname { color: var(--text); overflow: hidden; text-overflow: ellipsis; }
        .member-item .rtype { color: var(--text-faint); overflow: hidden; text-overflow: ellipsis; }
        .member-item.empty { color: var(--text-faint); font-style: italic; }
        .member-item.status-added { background: var(--added-bg); }
        .member-item.status-deleted { background: var(--deleted-bg); }
        .member-item.status-modified { background: var(--modified-bg); }

        /* Member click-to-jump styles */
        .member-item.clickable {
            cursor: pointer;
            transition: background 0.15s ease, transform 0.15s ease;
        }
        .member-item.clickable:hover {
            background: var(--surface-2) !important;
            transform: translateX(2px);
        }

        /* Open File Button */
        .open-file-btn {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 22px;
            height: 22px;
            background: transparent;
            border: none;
            color: var(--text-faint);
            font-size: 16px;
            font-weight: bold;
            line-height: 1;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            opacity: 0;
            transform: scale(0.9);
            transition: all 0.2s ease;
            z-index: 200;
            pointer-events: none;
        }
        .uml-box:hover .open-file-btn {
            opacity: 1;
            transform: scale(1);
            pointer-events: auto;
        }
        .open-file-btn:hover {
            color: var(--accent);
            transform: scale(1.15);
        }
        .open-file-btn:active {
            transform: scale(0.95);
        }

        /* Focus/Highlight Styles */
        .uml-box.dimmed {
            opacity: 0.28;
            transition: opacity 0.3s ease;
        }
        .uml-box.focused {
            opacity: 1 !important;
            border-color: var(--accent) !important;
            box-shadow: 0 10px 24px var(--glow) !important;
            z-index: 100 !important;
            transition: all 0.3s ease;
        }
        .uml-box.related {
            opacity: 1 !important;
            border-color: var(--accent) !important;
            box-shadow: 0 4px 14px var(--glow) !important;
            z-index: 50 !important;
            transition: all 0.3s ease;
        }
        .relationship-line {
            /* --diagram-zoom is kept in sync with currentZoom by applyZoom()
               (see script below) so line thickness scales with the content
               instead of staying a fixed screen-pixel width while the boxes
               around it grow/shrink - a constant width reads as "wrong" at
               either zoom extreme (too bold when shrunk, too thin when
               enlarged). Markers auto-scale with it too via markerUnits. */
            stroke: var(--text-dim);
            stroke-width: calc(1.4px * var(--diagram-zoom, 1));
            fill: none;
            transition: opacity 0.25s ease, stroke-width 0.25s ease, stroke 0.25s ease;
        }
        .relationship-line.dimmed {
            opacity: 0.08;
        }
        .relationship-line.highlighted {
            opacity: 1 !important;
            stroke: var(--text) !important;
            stroke-width: calc(2px * var(--diagram-zoom, 1)) !important;
        }
        .focus-badge {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--surface);
            background: color-mix(in srgb, var(--surface) 90%, transparent);
            border: 1px solid var(--border);
            color: var(--text);
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 12.5px;
            font-weight: 500;
            box-shadow: 0 8px 20px rgba(10, 14, 25, 0.16);
            z-index: 2000;
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease;
        }
        .focus-badge strong {
            color: var(--accent);
            font-weight: 650;
        }
        @keyframes slideIn {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        #zoomctl {
            position: fixed; right: 20px; top: 84px; z-index: 900;
            display: flex; flex-direction: column; gap: 6px;
        }
        #zoomctl button {
            width: 30px; height: 30px; border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--surface);
            background: color-mix(in srgb, var(--surface) 90%, transparent);
            color: var(--text); font-size: 15px; cursor: pointer;
            backdrop-filter: blur(10px);
            display: flex; align-items: center; justify-content: center;
        }
        #zoomctl button:hover { border-color: var(--accent); color: var(--accent); }
        #zoomctl button.active { border-color: var(--accent); color: var(--accent); }
        /* Hidden by default and toggled open next to the zoom controls (see
           toggleLegend) instead of permanently sitting over the diagram -
           a bottom-left overlay was covering real content underneath it. */
        #legend {
            display: none;
            position: fixed; right: 62px; top: 84px; z-index: 900;
            width: 220px;
            background: var(--surface);
            background: color-mix(in srgb, var(--surface) 90%, transparent);
            border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px;
            font-size: 11px; color: var(--text-dim); backdrop-filter: blur(10px); line-height: 1.7;
        }
        #legend.open { display: block; }
        #legend strong { color: var(--text); display: block; margin-bottom: 4px; font-size: 11.5px; }
        #legend strong.group { margin-top: 10px; }
        #legend .legend-row { display: flex; align-items: center; gap: 7px; }
        #legend .ln { width: 16px; height: 2px; border-radius: 2px; flex-shrink: 0; background: var(--text-dim); }
        #legend .ln.dashed { background: none; border-top: 2px dashed var(--text-dim); height: 0; }
        #legend .mk { width: 14px; height: 10px; flex-shrink: 0; color: var(--text-dim); }
        #legend .dot { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }
        ${generateFolderPanelCSS({ position: 'fixed', top: '84px', left: '16px' })}
    </style>
</head>
<body>
    <div class="header">
        <div class="header-title">
            ${iconUri ? `<img src="${iconUri}" style="height:40px;width:40px;object-fit:contain;opacity:0.85;flex-shrink:0" />` : ''}
            <div>
                <h1>${workspaceName}</h1>
                <p>${classCount} classes • ${folderCount} folders • ${edgeCount} relationships</p>
            </div>
        </div>
        <div class="header-controls">
            ${hasLiveHost ? '<button onclick="saveAsMD()">💾 Save as MD</button>' : ''}
            ${hasLiveHost ? '<button class="settings-btn" onclick="openSettings()">⚙️ Settings</button>' : ''}
        </div>
    </div>

    <div class="diagram-container" id="diagram">
        <svg id="relationship-svg"></svg>
        <div id="diagram-world">
            ${folderHTML}
        </div>
    </div>

    <div id="zoomctl">
        <button id="legend-toggle" onclick="toggleLegend()" title="Show legend">&#9432;</button>
        <button id="lines-toggle" class="active" onclick="toggleLines()" title="Hide relationship lines">
            <svg width="14" height="14" viewBox="0 0 14 14"><line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" stroke-width="1.6"/></svg>
        </button>
        <button onclick="zoomIn()" title="Zoom in">+</button>
        <button onclick="zoomOut()" title="Zoom out">&minus;</button>
    </div>
    <div id="legend">
        <strong>Relationships</strong>
        <div class="legend-row"><svg class="mk" viewBox="0 0 14 10"><polygon points="0,1 0,9 12,5" fill="var(--surface)" stroke="currentColor" stroke-width="1.3"/></svg> extends / implements — inheritance</div>
        <div class="legend-row"><svg class="mk" viewBox="0 0 14 10"><polyline points="0,0 11,5 0,10" fill="none" stroke="currentColor" stroke-width="1.3"/></svg> uses / has — dependency</div>
        <div class="legend-row"><span class="ln"></span> solid = structural &middot; <span class="ln dashed"></span> dashed = depends-on</div>
        <strong class="group">Change status</strong>
        <div class="legend-row"><span class="dot" style="background:var(--added)"></span> added</div>
        <div class="legend-row"><span class="dot" style="background:var(--deleted)"></span> deleted</div>
        <div class="legend-row"><span class="dot" style="background:var(--modified)"></span> modified</div>
    </div>

    <script>
        let EDGES = [];
        try {
            const rawJSON = '${edgesJSON}';
            EDGES = JSON.parse(rawJSON);
            console.log('✅ Parsed', EDGES.length, 'relationships');
        } catch (e) {
            console.error('❌ Failed to parse edges:', e);
        }
        
        let currentZoom = 1;

        // Initialize host communication: real VS Code webviews provide
        // acquireVsCodeApi(); other hosts (e.g. a browser <iframe>) get a
        // postMessage-to-parent shim instead, so the same message protocol
        // (saveAsMD/openSettings/openFile/openMember) works everywhere.
        const vscode = (typeof acquireVsCodeApi === 'function')
            ? acquireVsCodeApi()
            : { postMessage: (msg) => window.parent.postMessage(msg, '*') };
        
        function saveAsMD() {
            vscode.postMessage({
                command: 'saveAsMD',
                diagramName: '${workspaceName}'
            });
        }
        
        function openSettings() {
            vscode.postMessage({
                command: 'openSettings'
            });
        }
        
        function openMember(event, filePath, lineNumber, endLineNumber, memberName) {
            // Stop event propagation to prevent triggering class focus mode
            event.stopPropagation();
            
            console.log('Opening ' + memberName + ' at ' + filePath + ':' + lineNumber + '-' + endLineNumber);
            vscode.postMessage({
                command: 'openMember',
                filePath: filePath,
                lineNumber: lineNumber,
                endLineNumber: endLineNumber,
                memberName: memberName
            });
        }
        
        function zoomIn() {
            currentZoom = Math.min(currentZoom + 0.2, 3);
            applyZoom();
        }

        function zoomOut() {
            currentZoom = Math.max(currentZoom - 0.2, 0.3);
            applyZoom();
        }

        function resetZoom() {
            currentZoom = 1;
            applyZoom();
        }

        function toggleLegend() {
            document.getElementById('legend').classList.toggle('open');
            document.getElementById('legend-toggle').classList.toggle('active');
        }

        function toggleLines() {
            const svg = document.getElementById('relationship-svg');
            const nowHidden = svg.style.display !== 'none';
            svg.style.display = nowHidden ? 'none' : '';
            const btn = document.getElementById('lines-toggle');
            btn.classList.toggle('active', !nowHidden);
            btn.title = nowHidden ? 'Show relationship lines' : 'Hide relationship lines';
        }

        function applyZoom() {
            // Scale #diagram-world (the content), not #diagram (the fixed,
            // scrollable viewport around it) - scaling the viewport itself
            // would just shrink the visible frame in place rather than
            // revealing more of the world within a stable frame.
            const world = document.getElementById('diagram-world');
            world.style.transform = 'scale(' + currentZoom + ')';
            // Keeps .relationship-line's stroke-width (see CSS) proportional
            // to the current zoom, since the SVG itself isn't scaled by the
            // transform above (see drawRelationships).
            document.getElementById('relationship-svg').style.setProperty('--diagram-zoom', currentZoom);
            // Lines live outside #diagram-world (see drawRelationships), so
            // they need to be recomputed against the boxes' new post-zoom
            // positions rather than being carried along by the transform.
            drawRelationships();
        }
        
        // Log stats on load
        window.addEventListener('load', function() {
            console.log('=== CSS Grid Diagram Loaded ===');
            console.log('Total classes:', document.querySelectorAll('.uml-box').length);
            console.log('Total folders:', document.querySelectorAll('.folder-container').length);
            console.log('Total relationships:', EDGES.length);
            
            // Draw lines after layout is complete
            setTimeout(drawRelationships, 500);
        });
        
        function drawRelationships() {
            const svg = document.getElementById('relationship-svg');
            const container = document.getElementById('diagram');
            
            if (!svg || !container) {
                console.error('SVG or container not found');
                return;
            }
            
            // Set SVG size to match container's scroll dimensions
            svg.setAttribute('width', container.scrollWidth);
            svg.setAttribute('height', container.scrollHeight);
            
            // Clear existing lines
            svg.innerHTML = '';
            
            // ===== CREATE ALL MARKER DEFINITIONS FIRST =====
            // Markers must exist before any lines reference them
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            
            // UML standard markers with correct shapes
            const markerConfigs = [
                { type: 'extends', shape: 'hollow-triangle' },      // Inheritance
                { type: 'implements', shape: 'hollow-triangle' },   // Realization
                { type: 'uses', shape: 'open-arrow' },              // Dependency
                { type: 'has', shape: 'open-arrow' },               // Association
                { type: 'highlight', shape: 'filled-triangle' }     // Focus state
            ];
            
            markerConfigs.forEach(({ type, shape }) => {
                const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                marker.setAttribute('id', type === 'highlight' ? 'arrow-highlight' : 'arrow-' + type);
                marker.setAttribute('markerWidth', '12');
                marker.setAttribute('markerHeight', '12');
                marker.setAttribute('orient', 'auto');
                marker.setAttribute('markerUnits', 'strokeWidth');
                
                // Create shape based on type
                if (shape === 'hollow-triangle') {
                    // Hollow triangle for inheritance/realization (UML standard)
                    // Inset to center the white fill within the stroke
                    marker.setAttribute('refX', '10');
                    marker.setAttribute('refY', '5');
                    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    polygon.setAttribute('points', '1,1 1,9 9,5');
                    polygon.setAttribute('fill', 'var(--surface)');
                    polygon.setAttribute('stroke', 'currentColor');
                    polygon.setAttribute('stroke-width', '1.5');
                    polygon.setAttribute('stroke-linejoin', 'miter');
                    marker.appendChild(polygon);
                }
                else if (shape === 'filled-triangle') {
                    // Filled triangle for highlight state
                    marker.setAttribute('refX', '10');
                    marker.setAttribute('refY', '6');
                    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    polygon.setAttribute('points', '0,0 0,12 10,6');
                    polygon.setAttribute('fill', 'currentColor');
                    marker.appendChild(polygon);
                }
                else if (shape === 'open-arrow') {
                    // Open arrow for dependency/association
                    marker.setAttribute('refX', '9');
                    marker.setAttribute('refY', '6');
                    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                    polyline.setAttribute('points', '0,0 9,6 0,12');
                    polyline.setAttribute('fill', 'none');
                    polyline.setAttribute('stroke', 'currentColor');
                    polyline.setAttribute('stroke-width', '1.5');
                    marker.appendChild(polyline);
                }
                
                defs.appendChild(marker);
            });
            
            svg.appendChild(defs);
            // Force browser to recognize markers exist (trigger reflow)
            svg.getBoundingClientRect();
            // ===== END MARKER DEFINITIONS =====
            
            console.log('🔍 Drawing', EDGES.length, 'relationships...');
            
            let drawnCount = 0;
            let skippedCount = 0;
            
            // Get container's position for offset calculation
            const containerRect = container.getBoundingClientRect();
            
            // Helper function to find where a line intersects with a rectangle border
            function getBoxEdgePoint(boxRect, centerX, centerY, targetX, targetY, scrollLeft, scrollTop) {
                const dx = targetX - centerX;
                const dy = targetY - centerY;
                
                if (dx === 0 && dy === 0) {
                    return { x: centerX, y: centerY };
                }
                
                const halfWidth = boxRect.width / 2;
                const halfHeight = boxRect.height / 2;
                
                // Determine which edge the line exits from based on angle
                if (Math.abs(dx) * halfHeight > Math.abs(dy) * halfWidth) {
                    // Exits through left or right edge
                    if (dx > 0) {
                        // Right edge
                        return {
                            x: centerX + halfWidth,
                            y: centerY + (halfWidth * dy / dx)
                        };
                    } else {
                        // Left edge
                        return {
                            x: centerX - halfWidth,
                            y: centerY - (halfWidth * dy / dx)
                        };
                    }
                } else {
                    // Exits through top or bottom edge
                    if (dy > 0) {
                        // Bottom edge
                        return {
                            x: centerX + (halfHeight * dx / dy),
                            y: centerY + halfHeight
                        };
                    } else {
                        // Top edge
                        return {
                            x: centerX - (halfHeight * dx / dy),
                            y: centerY - halfHeight
                        };
                    }
                }
            }
            
            // ===== Pass 1: Compute the raw straight-line coordinates for every edge =====
            const rawLines = [];

            EDGES.forEach((edge, edgeIndex) => {
                const sourceBox = document.querySelector('[data-class="' + CSS.escape(edge.source) + '"]');
                const targetBox = document.querySelector('[data-class="' + CSS.escape(edge.target) + '"]');

                // offsetParent is null when the box or any ancestor (its
                // .folder-container, if hidden via the folder panel) has
                // display:none - getBoundingClientRect() on it would
                // return a bogus zero-sized rect rather than throwing.
                if (!sourceBox || !targetBox || sourceBox.offsetParent === null || targetBox.offsetParent === null) {
                    skippedCount++;
                    return;
                }

                // Get positions relative to viewport
                const sourceRect = sourceBox.getBoundingClientRect();
                const targetRect = targetBox.getBoundingClientRect();

                // Calculate center points in container-relative coordinates
                const sourceCenterX = sourceRect.left - containerRect.left + sourceRect.width / 2 + container.scrollLeft;
                const sourceCenterY = sourceRect.top - containerRect.top + sourceRect.height / 2 + container.scrollTop;
                const targetCenterX = targetRect.left - containerRect.left + targetRect.width / 2 + container.scrollLeft;
                const targetCenterY = targetRect.top - containerRect.top + targetRect.height / 2 + container.scrollTop;

                // Calculate edge intersection points
                const startPoint = getBoxEdgePoint(sourceRect, sourceCenterX, sourceCenterY, targetCenterX, targetCenterY, container.scrollLeft, container.scrollTop);
                const endPoint = getBoxEdgePoint(targetRect, targetCenterX, targetCenterY, sourceCenterX, sourceCenterY, container.scrollLeft, container.scrollTop);

                // Determine line style based on relationship type (UML standard)
                // Handle multiple types (e.g., "extends, calls-super") - use primary type
                const rawType = edge.label || 'uses';
                const type = rawType.split(',')[0].trim();  // Extract first type for marker

                rawLines.push({
                    edgeIndex,
                    source: edge.source,
                    target: edge.target,
                    type,
                    x1: startPoint.x,
                    y1: startPoint.y,
                    x2: endPoint.x,
                    y2: endPoint.y
                });
            });

            // ===== Pass 2: Detect lines that overlap and spread them apart =====
            // Two segments are treated as overlapping when they sit on (nearly) the same
            // infinite line AND their projections onto that line intersect - this covers
            // exact duplicates (same source/target, different relationship types) as well
            // as separate relationships that happen to line up in the same row/column.
            // Works for horizontal, vertical, and diagonal lines alike since it reasons
            // about the line's own direction rather than assuming a fixed axis.
            // Coordinates here are post-zoom screen pixels (boxes live inside
            // #diagram-world, which is scaled by currentZoom), so these
            // thresholds must scale with it too - otherwise a fixed pixel
            // gap means a much larger *real* distance once zoomed out,
            // causing unrelated lines to falsely cluster and fan out way
            // past their boxes.
            const GAP_TOLERANCE = 20 * currentZoom;   // px - segments within this gap still count as touching
            const OFFSET_SPACING = 12 * currentZoom;  // px - perpendicular distance between spread-out lines

            const lineMeta = rawLines.map(rawLine => {
                const dx = rawLine.x2 - rawLine.x1;
                const dy = rawLine.y2 - rawLine.y1;

                // Line equation A*x + B*y + C = 0, normalized to a unit normal (a, b)
                let a = dy;
                let b = -dx;
                const len = Math.hypot(a, b) || 1;
                a /= len;
                b /= len;
                let c = -(a * rawLine.x1 + b * rawLine.y1);

                // Canonicalize sign so the same infinite line always produces the same key,
                // regardless of which end of the segment (source/target) came first
                if (a < 0 || (a === 0 && b < 0)) {
                    a = -a; b = -b; c = -c;
                }

                const key = Math.round(a * 100) + ',' + Math.round(b * 100) + ',' + Math.round(c / 3);

                // Direction along the line (perpendicular to the normal), used to project
                // each endpoint onto the line so overlap can be measured as a 1D interval
                const dirX = -b, dirY = a;
                const t1 = rawLine.x1 * dirX + rawLine.y1 * dirY;
                const t2 = rawLine.x2 * dirX + rawLine.y2 * dirY;

                return { ...rawLine, a, b, key, tmin: Math.min(t1, t2), tmax: Math.max(t1, t2) };
            });

            // Group by infinite-line key, then union-find segments whose intervals overlap
            const lineGroups = new Map();
            lineMeta.forEach((lineInfo, i) => {
                if (!lineGroups.has(lineInfo.key)) lineGroups.set(lineInfo.key, []);
                lineGroups.get(lineInfo.key).push(i);
            });

            const parent = lineMeta.map((_, i) => i);
            const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
            const union = (i, j) => {
                const ri = find(i), rj = find(j);
                if (ri !== rj) parent[ri] = rj;
            };

            lineGroups.forEach(indices => {
                for (let i = 0; i < indices.length; i++) {
                    for (let j = i + 1; j < indices.length; j++) {
                        const li = lineMeta[indices[i]];
                        const lj = lineMeta[indices[j]];
                        if (li.tmin - GAP_TOLERANCE <= lj.tmax && lj.tmin - GAP_TOLERANCE <= li.tmax) {
                            union(indices[i], indices[j]);
                        }
                    }
                }
            });

            const overlapClusters = new Map();
            lineMeta.forEach((lineInfo, i) => {
                const root = find(i);
                if (!overlapClusters.has(root)) overlapClusters.set(root, []);
                overlapClusters.get(root).push(i);
            });

            overlapClusters.forEach(members => {
                if (members.length <= 1) return; // No overlap - keep as a plain straight line

                members.sort((x, y) => lineMeta[x].tmin - lineMeta[y].tmin || x - y);
                const n = members.length;

                members.forEach((memberIndex, order) => {
                    const lineInfo = lineMeta[memberIndex];
                    const offset = (order - (n - 1) / 2) * OFFSET_SPACING;
                    lineInfo.x1 += lineInfo.a * offset;
                    lineInfo.y1 += lineInfo.b * offset;
                    lineInfo.x2 += lineInfo.a * offset;
                    lineInfo.y2 += lineInfo.b * offset;
                });
            });

            // ===== Pass 3: Draw the (possibly spread-out) straight lines =====
            lineMeta.forEach(lineInfo => {
                // Stroke color/width come from the .relationship-line CSS rule
                // (theme-aware) - only the dash pattern is set here, per edge type.
                let dashArray = '';  // solid by default

                // Dashed lines for: implements, uses (dependency)
                if (lineInfo.type === 'implements' || lineInfo.type === 'uses') {
                    dashArray = '5,5';
                }

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.classList.add('relationship-line');
                line.setAttribute('data-edge-id', \`edge-\${lineInfo.edgeIndex}\`);
                line.setAttribute('data-source', lineInfo.source);
                line.setAttribute('data-target', lineInfo.target);
                line.setAttribute('x1', lineInfo.x1);
                line.setAttribute('y1', lineInfo.y1);
                line.setAttribute('x2', lineInfo.x2);
                line.setAttribute('y2', lineInfo.y2);
                if (dashArray) {
                    line.setAttribute('stroke-dasharray', dashArray);
                }

                // Reference marker (already created upfront)
                const markerId = 'arrow-' + lineInfo.type;
                line.setAttribute('marker-end', 'url(#' + markerId + ')');

                svg.appendChild(line);
                drawnCount++;
            });

            console.log(\`✅ Drew \${drawnCount} lines, skipped \${skippedCount}\`);
        }
        
        // ===== FOCUS/HIGHLIGHT SYSTEM =====
        let focusedClassId = null;
        
        function setupClassClickHandlers() {
            const allBoxes = document.querySelectorAll('.uml-box');
            allBoxes.forEach(box => {
                box.addEventListener('click', function(e) {
                    // Don't trigger on method clicks or button clicks
                    if (e.target.closest('.method-item') || e.target.closest('.open-file-btn')) {
                        return;
                    }
                    
                    const classId = box.getAttribute('data-class');
                    if (!classId) return;
                    
                    // Toggle: if clicking the same class, clear focus
                    if (focusedClassId === classId) {
                        clearFocus();
                    } else {
                        focusOnClass(classId);
                    }
                });
            });
            
            // Setup open file button handlers
            const openButtons = document.querySelectorAll('.open-file-btn');
            openButtons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent focus trigger
                    const box = btn.closest('.uml-box');
                    const filePath = box?.getAttribute('data-file-path');
                    if (filePath) {
                        console.log('🚀 Opening file:', filePath);
                        vscode.postMessage({
                            command: 'openFile',
                            filePath: filePath
                        });
                    }
                });
            });
            
            // ESC to clear focus
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && focusedClassId) {
                    clearFocus();
                }
            });
        }
        
        function focusOnClass(classId) {
            console.log('🎯 Focusing on:', classId);
            focusedClassId = classId;
            
            // Find all related class IDs
            const relatedIds = findRelatedClasses(classId);
            console.log('🔗 Related classes:', relatedIds);
            
            // Get all boxes and lines
            const allBoxes = document.querySelectorAll('.uml-box');
            const allLines = document.querySelectorAll('.relationship-line');
            
            // Dim everything first
            allBoxes.forEach(box => {
                box.classList.add('dimmed');
                box.classList.remove('focused', 'related');
            });
            allLines.forEach(line => {
                line.classList.add('dimmed');
                line.classList.remove('highlighted');
            });
            
            // Highlight the focused class
            const focusedBox = document.querySelector(\`.uml-box[data-class="\${classId}"]\`);
            if (focusedBox) {
                focusedBox.classList.remove('dimmed');
                focusedBox.classList.add('focused');
            }
            
            // Highlight related classes
            relatedIds.forEach(relId => {
                const relBox = document.querySelector(\`.uml-box[data-class="\${relId}"]\`);
                if (relBox) {
                    relBox.classList.remove('dimmed');
                    relBox.classList.add('related');
                }
            });
            
            // Highlight related relationships
            const relatedEdgeIds = findRelatedEdges(classId, relatedIds);
            relatedEdgeIds.forEach(edgeId => {
                const line = document.querySelector(\`[data-edge-id="\${edgeId}"]\`);
                if (line) {
                    line.classList.remove('dimmed');
                    line.classList.add('highlighted');
                    // Keep original UML marker shape - CSS handles highlighting
                }
            });
            
            // Show badge
            showFocusBadge();
        }
        
        function findRelatedClasses(classId) {
            const related = new Set();
            
            // Find all edges connected to this class
            EDGES.forEach(edge => {
                if (edge.source === classId) {
                    related.add(edge.target);
                } else if (edge.target === classId) {
                    related.add(edge.source);
                }
            });
            
            return Array.from(related);
        }
        
        function findRelatedEdges(focusedId, relatedIds) {
            const allIds = new Set([focusedId, ...relatedIds]);
            const edgeIds = [];
            
            EDGES.forEach((edge, index) => {
                if (allIds.has(edge.source) && allIds.has(edge.target)) {
                    edgeIds.push(\`edge-\${index}\`);
                }
            });
            
            return edgeIds;
        }
        
        function clearFocus() {
            console.log('✨ Clearing focus');
            focusedClassId = null;
            
            const allBoxes = document.querySelectorAll('.uml-box');
            const allLines = document.querySelectorAll('.relationship-line');
            
            allBoxes.forEach(box => {
                box.classList.remove('dimmed', 'focused', 'related');
            });
            allLines.forEach(line => {
                line.classList.remove('dimmed', 'highlighted');
                // Markers stay as original UML shapes
            });
            
            hideFocusBadge();
        }
        
        function showFocusBadge() {
            let badge = document.querySelector('.focus-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'focus-badge';
                badge.innerHTML = '💡 Press <strong>ESC</strong> to clear focus';
                document.body.appendChild(badge);
            }
        }
        
        function hideFocusBadge() {
            const badge = document.querySelector('.focus-badge');
            if (badge) {
                badge.remove();
            }
        }
        
        // Initialize click handlers after load
        window.addEventListener('load', function() {
            setupClassClickHandlers();
        });
        
        // Redraw lines on window resize or container scroll
        window.addEventListener('resize', function() {
            setTimeout(drawRelationships, 200);
        });
        
        document.getElementById('diagram').addEventListener('scroll', function() {
            setTimeout(drawRelationships, 100);
        });

        // ---- folder panel (drill-down, hide/show, drag-reorder) - see
        // folderPanelScript.ts for the tree/drag logic itself, shared with
        // the stack layer's own panel so both look and behave identically.
        // It calls these two functions to apply state to this page's
        // actual boxes/lines rather than knowing anything about them
        // directly, and reads the leaf-folder set off the already-rendered
        // DOM boxes (the stack layer, not having any DOM boxes of its own,
        // assigns this from its server-sent data instead). ----
        window.FOLDER_PANEL_LEAVES = Array.from(document.querySelectorAll('.folder-container[data-folder]')).map(function (el) {
            const nameEl = el.querySelector('.folder-name');
            return { path: el.getAttribute('data-folder'), name: nameEl ? nameEl.textContent : el.getAttribute('data-folder') };
        });
        window.FOLDER_PANEL_INITIAL_HIDDEN = Array.from(document.querySelectorAll('.folder-container[data-hidden="true"]')).map(function (el) {
            return el.getAttribute('data-folder');
        });
        window.FOLDER_PANEL_INITIAL_EXPANDED = ${JSON.stringify(initialExpanded)};
        window.FOLDER_PANEL_INITIAL_OPEN = ${JSON.stringify(initialPanelOpen)};

        // Every class box's original folder, recorded once before any
        // collapsing happens - applyFolderPlan needs this to put a box
        // back where it came from once its group re-expands, since a
        // merged box has no other record of which real folder a class
        // used to belong to.
        const classHomeGrid = {};
        document.querySelectorAll('.classes-grid[data-folder-classes]').forEach(function (grid) {
            grid.querySelectorAll(':scope > .uml-box[data-class]').forEach(function (box) {
                classHomeGrid[box.getAttribute('data-class')] = grid;
            });
        });

        function escapeHtmlForPanel(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // A collapsed group's classes all move into one synthetic box
        // (mirrors the 3D stack's own aggregate sheet) instead of each
        // real folder keeping its own; expanding the group is what breaks
        // it back apart into the real per-folder boxes. Every call starts
        // by undoing the previous plan entirely and rebuilding from
        // scratch, rather than diffing - simple and correct, and cheap
        // enough at this scale.
        window.applyFolderPlan = function (plan) {
            // Move every class box back to its real home *before* removing
            // the old merged containers, not after - a merged container's
            // boxes are still physically parented inside it at this point,
            // and Element.remove() takes its whole subtree with it, so
            // querying for a box already-removed this way would silently
            // fail to find (and thus resurrect) it.
            Object.keys(classHomeGrid).forEach(function (classId) {
                const box = document.querySelector('.uml-box[data-class="' + CSS.escape(classId) + '"]');
                const home = classHomeGrid[classId];
                if (box && home && box.parentElement !== home) home.appendChild(box);
            });
            document.querySelectorAll('.folder-container[data-merged-group]').forEach(function (el) { el.remove(); });
            document.querySelectorAll('.folder-container[data-folder]').forEach(function (el) { el.style.display = ''; });

            const world = document.getElementById('diagram-world');
            plan.forEach(function (item) {
                if (item.type === 'leaf') {
                    const el = document.querySelector('.folder-container[data-folder="' + CSS.escape(item.path) + '"]');
                    if (!el) return;
                    world.appendChild(el);
                    el.style.display = item.hidden ? 'none' : '';
                    return;
                }
                const firstEl = document.querySelector('.folder-container[data-folder="' + CSS.escape(item.realPaths[0]) + '"]');
                if (!firstEl) return;
                const merged = document.createElement('div');
                merged.className = 'folder-container';
                merged.setAttribute('data-merged-group', item.path);
                merged.innerHTML = '<div class="folder-header"><span>\\ud83d\\udcc1</span><span class="folder-name">' + escapeHtmlForPanel(item.name)
                    + '</span><span class="folder-path">| ' + escapeHtmlForPanel(item.path) + '</span></div><div class="classes-grid"></div>';
                world.appendChild(merged);
                merged.style.display = item.hidden ? 'none' : '';
                const mergedGrid = merged.querySelector('.classes-grid');
                item.realPaths.forEach(function (p) {
                    const el = document.querySelector('.folder-container[data-folder="' + CSS.escape(p) + '"]');
                    if (!el) return;
                    el.style.display = 'none';
                    el.querySelectorAll(':scope > .classes-grid > .uml-box').forEach(function (box) { mergedGrid.appendChild(box); });
                });
            });
            drawRelationships();
        };
        window.highlightFolderPaths = function (paths, on) {
            paths.forEach(function (p) {
                const el = document.querySelector('.folder-container[data-folder="' + CSS.escape(p) + '"], .folder-container[data-merged-group="' + CSS.escape(p) + '"]');
                if (el) el.classList.toggle('folder-highlighted', on);
            });
        };
        ${generateFolderPanelScript()}
    </script>
</body>
</html>`;
	}
}
