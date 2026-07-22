import { ReactFlowNode, ReactFlowEdge } from '../types/view';
import { FolderStructureBuilder } from '../services/diagram/folderStructure';
import { FolderBoxRenderer } from './components/folderBoxRenderer';
import { KrataiConfig } from '../types/config/KrataiConfig';

export class ClassDiagramView {
	
	static generate(nodes: ReactFlowNode[], edges: ReactFlowEdge[], workspaceName: string, config: KrataiConfig, iconUri?: string): string {
		// Step 1: Build folder structure
		const root = FolderStructureBuilder.build(nodes);
		console.log('=== Folder Structure (Flat Layout with Custom Order) ===');
		FolderStructureBuilder.logStructure(root);
		console.log(`\n📊 Total: ${nodes.length} classes, ${FolderStructureBuilder.countFolders(root)} folders`);

		// Step 2: Render with flat layout and custom folder ordering
		const folderRenderer = new FolderBoxRenderer(config);
		const folderHTML = folderRenderer.renderAll(root);

		console.log(`\n✅ Generated HTML with flat folder layout`);
		console.log(`📝 All ${nodes.length} classes rendered in ordered flat containers`);
		console.log(`🔗 ${edges.length} relationships will be drawn as lines`);
		
		// Step 3: Generate final HTML with relationship data
		return this.generateHTML(
			workspaceName,
			nodes.length,
			edges.length,
			FolderStructureBuilder.countFolders(root),
			folderHTML,
			edges,
			iconUri
		);
	}

	private static generateHTML(
		workspaceName: string,
		classCount: number,
		edgeCount: number,
		folderCount: number,
		folderHTML: string,
		edges: ReactFlowEdge[],
		iconUri?: string
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
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
        }
        .header {
            position: sticky;
            top: 0;
            background: #333;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            border-bottom: 2px solid #ccc;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header-controls {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .header-controls button {
            padding: 8px 16px;
            border: 2px solid #ccc;
            background: #2d2d30;
            color: #e0e0e0;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: 500;
        }
        .header-controls button:hover {
            background: #3e3e42;
        }
        .header-controls .settings-btn {
            border-color: #5dade2;
            color: #5dade2;
        }
        .header-controls .settings-btn:hover {
            background: #2c5a7c;
        }
        .header h1 {
            margin: 0;
            font-size: 1.5em;
            color: #ffffff;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #cccccc;
            font-size: 0.95em;
        }
        .stats {
            background: #e0e0e0;
            color: #333;
            padding: 10px 20px;
            border-radius: 4px;
            font-size: 0.9em;
            font-weight: 500;
        }
        .uml-box {
            cursor: pointer;
            background: white;
            position: relative;
            z-index: 10;
        }
        .diagram-container {
            position: relative;
            padding: 20px;
            max-width: 100%;
            overflow-x: auto;
        }
        #relationship-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
        }
        .folder-container {
            position: relative;
        }
        .folder-header {
            position: relative;
            z-index: 1;
        }
        
        /* Method styling */
        .method-item {
            transition: background 0.15s ease;
        }
        /* Member click-to-jump styles */
        .member-item.clickable {
            transition: all 0.15s ease;
        }
        .member-item.clickable:hover {
            background: rgba(100, 150, 200, 0.2) !important;
            transform: translateX(2px);
        }
        
        /* Open File Button */
        .open-file-btn {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 24px;
            height: 24px;
            background: transparent;
            border: none;
            color: #999999;
            font-size: 18px;
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
            color: #000000;
            transform: scale(1.2);
        }
        .open-file-btn:active {
            transform: scale(0.95);
        }
        
        /* Focus/Highlight Styles */
        .uml-box.dimmed {
            opacity: 0.25;
            filter: grayscale(60%);
            transition: opacity 0.3s ease, filter 0.3s ease;
        }
        .uml-box.focused {
            opacity: 1 !important;
            filter: none !important;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.9) !important;
            border-color: #000000 !important;
            border-width: 3px !important;
            z-index: 100 !important;
            transition: all 0.3s ease;
        }
        .uml-box.related {
            opacity: 1 !important;
            filter: none !important;
            box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.7) !important;
            border-color: #000000 !important;
            border-width: 2px !important;
            z-index: 50 !important;
            transition: all 0.3s ease;
        }
        .relationship-line.dimmed {
            opacity: 0.15;
            transition: opacity 0.3s ease;
        }
        .relationship-line.highlighted {
            opacity: 1 !important;
            stroke: #000000 !important;
            stroke-width: 2 !important;
            transition: all 0.3s ease;
        }
        .focus-badge {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(30, 30, 30, 0.95);
            border: 1px solid #666666;
            color: #FFFFFF;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            z-index: 2000;
            animation: slideIn 0.3s ease;
        }
        .focus-badge strong {
            color: #FFFFFF;
            font-weight: 600;
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

    </style>
</head>
<body>
    <div class="header">
        <div style="display:flex;align-items:center;gap:16px">
            ${iconUri ? `<img src="${iconUri}" style="height:48px;width:48px;object-fit:contain;filter:invert(1);opacity:0.9;flex-shrink:0" />` : ''}
            <div>
                <h1>${workspaceName}</h1>
                <p>${classCount} classes • ${folderCount} folders • ${edgeCount} relationships</p>
            </div>
        </div>
        <div class="header-controls">
            <button onclick="zoomIn()">Zoom In</button>
            <button onclick="zoomOut()">Zoom Out</button>
            <button onclick="saveAsMD()">💾 Save as MD</button>
            <button onclick="openSettings()">⚙️ Settings</button>
        </div>
    </div>
    
    <div class="diagram-container" id="diagram">
        <svg id="relationship-svg"></svg>
        ${folderHTML}
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
        
        // Initialize VS Code API for communication
        const vscode = acquireVsCodeApi();
        
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
        
        function applyZoom() {
            const diagram = document.getElementById('diagram');
            diagram.style.transform = 'scale(' + currentZoom + ')';
            diagram.style.transformOrigin = 'top left';
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
                { type: 'owns', shape: 'hollow-diamond' },          // Aggregation
                { type: 'contains', shape: 'filled-diamond' },      // Composition
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
                    polygon.setAttribute('fill', 'white');
                    polygon.setAttribute('stroke', '#000000');
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
                    polygon.setAttribute('fill', '#000000');
                    marker.appendChild(polygon);
                }
                else if (shape === 'filled-diamond') {
                    // Filled diamond for composition
                    marker.setAttribute('refX', '9');
                    marker.setAttribute('refY', '6');
                    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    polygon.setAttribute('points', '0,6 4.5,0 9,6 4.5,12');
                    polygon.setAttribute('fill', '#000000');
                    marker.appendChild(polygon);
                }
                else if (shape === 'hollow-diamond') {
                    // Hollow diamond for aggregation
                    marker.setAttribute('refX', '9');
                    marker.setAttribute('refY', '6');
                    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    polygon.setAttribute('points', '0,6 4.5,0 9,6 4.5,12');
                    polygon.setAttribute('fill', 'white');
                    polygon.setAttribute('stroke', '#000000');
                    polygon.setAttribute('stroke-width', '1.5');
                    marker.appendChild(polygon);
                }
                else if (shape === 'open-arrow') {
                    // Open arrow for dependency/association
                    marker.setAttribute('refX', '9');
                    marker.setAttribute('refY', '6');
                    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                    polyline.setAttribute('points', '0,0 9,6 0,12');
                    polyline.setAttribute('fill', 'none');
                    polyline.setAttribute('stroke', '#000000');
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

                if (!sourceBox || !targetBox) {
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
            const GAP_TOLERANCE = 20;   // px - segments within this gap still count as touching
            const OFFSET_SPACING = 12;  // px - perpendicular distance between spread-out lines

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
                // UML standard: all lines are black, differentiated by style (solid/dashed)
                const color = '#000000';
                const strokeWidth = '2';
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
                line.setAttribute('stroke', color);
                line.setAttribute('stroke-width', strokeWidth);
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
    </script>
</body>
</html>`;
	}
}
