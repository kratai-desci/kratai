import { ReactFlowNode, ReactFlowEdge } from '../types/diagram';
import { FolderStructureBuilder } from './components/folderStructure';
import { FolderBoxRenderer } from './components/folderBoxRenderer';

export class ClassDiagramView {
	
	static generate(nodes: ReactFlowNode[], edges: ReactFlowEdge[], workspaceName: string): string {
		// Step 1: Build folder structure
		const root = FolderStructureBuilder.build(nodes);
		console.log('=== Folder Structure (CSS Grid Layout) ===');
		FolderStructureBuilder.logStructure(root);
		console.log(`\n📊 Total: ${nodes.length} classes, ${FolderStructureBuilder.countFolders(root)} folders`);

		// Step 2: Render with CSS Grid layout
		const folderRenderer = new FolderBoxRenderer();
		const folderHTML = folderRenderer.renderAll(root);

		console.log(`\n✅ Generated HTML with CSS Grid layout`);
		console.log(`📝 All ${nodes.length} classes rendered in CSS Grid containers`);
		console.log(`🔗 ${edges.length} relationships will be drawn as lines`);
		
		// Step 3: Generate final HTML with relationship data
		return this.generateHTML(
			workspaceName,
			nodes.length,
			edges.length,
			FolderStructureBuilder.countFolders(root),
			folderHTML,
			edges
		);
	}

	private static generateHTML(
		workspaceName: string,
		classCount: number,
		edgeCount: number,
		folderCount: number,
		folderHTML: string,
		edges: ReactFlowEdge[]
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
            background: white;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border-bottom: 2px solid #333;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 {
            margin: 0;
            font-size: 1.5em;
            color: #333;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 0.95em;
        }
        .stats {
            background: #333;
            color: white;
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
        .zoom-controls {
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1001;
        }
        .zoom-controls button {
            display: block;
            margin: 5px 0;
            padding: 8px 16px;
            border: 2px solid #333;
            background: white;
            color: #333;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            width: 100%;
            font-weight: 500;
        }
        .zoom-controls button:hover {
            background: #f0f0f0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>📊 Hierarchical Class Diagram (CSS Grid)</h1>
            <p>${workspaceName} • ${classCount} classes • ${folderCount} folders • ${edgeCount} relationships</p>
        </div>
    </div>
    
    <div class="zoom-controls">
        <button onclick="zoomIn()">🔍 Zoom In</button>
        <button onclick="zoomOut()">🔍 Zoom Out</button>
        <button onclick="resetZoom()">↺ Reset</button>
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
            
            EDGES.forEach(edge => {
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
                
                // Determine line color based on relationship type
                const type = edge.label || 'uses';
                let color = '#95a5a6';  // default gray
                if (type === 'extends') color = '#3498db';     // blue
                if (type === 'implements') color = '#9b59b6';  // purple
                if (type === 'composition') color = '#e74c3c'; // red
                
                // Create line element
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', startPoint.x);
                line.setAttribute('y1', startPoint.y);
                line.setAttribute('x2', endPoint.x);
                line.setAttribute('y2', endPoint.y);
                line.setAttribute('stroke', color);
                line.setAttribute('stroke-width', '2.5');
                line.setAttribute('stroke-opacity', '0.7');
                
                // Add arrow marker
                const markerId = 'arrow-' + type;
                if (!document.getElementById(markerId)) {
                    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
                    marker.setAttribute('id', markerId);
                    marker.setAttribute('markerWidth', '10');
                    marker.setAttribute('markerHeight', '10');
                    marker.setAttribute('refX', '9');
                    marker.setAttribute('refY', '3');
                    marker.setAttribute('orient', 'auto');
                    marker.setAttribute('markerUnits', 'strokeWidth');
                    
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', 'M0,0 L0,6 L9,3 z');
                    path.setAttribute('fill', color);
                    
                    marker.appendChild(path);
                    defs.appendChild(marker);
                    svg.appendChild(defs);
                }
                
                line.setAttribute('marker-end', 'url(#' + markerId + ')');
                
                svg.appendChild(line);
                drawnCount++;
            });
            
            console.log(\`✅ Drew \${drawnCount} lines, skipped \${skippedCount}\`);
        }
        
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
