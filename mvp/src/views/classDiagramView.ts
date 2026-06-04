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
		const edgesJSON = JSON.stringify(edges).replace(/'/g, '&#039;').replace(/"/g, '&quot;');
		
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
        .diagram-container {
            padding: 20px;
            max-width: 100%;
            overflow-x: auto;
        }
        .uml-box {
            cursor: pointer;
        }
        #relationship-svg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 1;
        }
        .diagram-container {
            position: relative;
            z-index: 2;
        }
        .folder-container, .uml-box {
            position: relative;
            z-index: 3;
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
            <p>${workspaceName} • ${classCount} classes • ${folderCount} folders</p>
        </div>
        <div class="stats">
            ${edgeCount} relationships
        </div>
    </div>
    
    <div class="zoom-controls">
        <button onclick="zoomIn()">🔍 Zoom In</button>
        <button onclick="zoomOut()">🔍 Zoom Out</button>
        <button onclick="resetZoom()">↺ Reset</button>
    </div>
    
    <svg id="relationship-svg"></svg>
    
    <div class="diagram-container" id="diagram">
        ${folderHTML}
    </div>
    
    <script>
        let EDGES = [];
        try {
            EDGES = JSON.parse('${edgesJSON}');
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
            console.log('Total relationships to draw:', EDGES.length);
            
            if (EDGES.length > 0) {
                console.log('Sample edge:', EDGES[0]);
            }
            
            console.log('✅ Drawing relationship lines...');
            
            // Draw lines after layout is complete
            setTimeout(drawRelationships, 500);
        });
        
        function drawRelationships() {
            const svg = document.getElementById('relationship-svg');
            
            // Set SVG size to viewport
            svg.setAttribute('width', window.innerWidth);
            svg.setAttribute('height', document.documentElement.scrollHeight);
            
            // Clear existing lines
            svg.innerHTML = '';
            
            console.log('🔍 Attempting to draw', EDGES.length, 'relationships');
            
            let drawnCount = 0;
            let skippedCount = 0;
            
            EDGES.forEach(edge => {
                const sourceBox = document.querySelector('[data-class="' + CSS.escape(edge.source) + '"]');
                const targetBox = document.querySelector('[data-class="' + CSS.escape(edge.target) + '"]');
                
                if (!sourceBox || !targetBox) {
                    skippedCount++;
                    console.log('⚠️  Skipped:', edge.source, '->', edge.target, '(element not found)');
                    return;
                }
                
                const sourceRect = sourceBox.getBoundingClientRect();
                const targetRect = targetBox.getBoundingClientRect();
                
                // Calculate center points in viewport coordinates
                const x1 = sourceRect.left + sourceRect.width / 2 + window.scrollX;
                const y1 = sourceRect.top + sourceRect.height / 2 + window.scrollY;
                const x2 = targetRect.left + targetRect.width / 2 + window.scrollX;
                const y2 = targetRect.top + targetRect.height / 2 + window.scrollY;
                
                // Determine line color based on relationship type
                const type = edge.label || 'uses';
                let color = '#95a5a6';  // default gray
                if (type === 'extends') color = '#3498db';     // blue
                if (type === 'implements') color = '#9b59b6';  // purple
                if (type === 'composition') color = '#e74c3c'; // red
                
                // Create line element
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('stroke', color);
                line.setAttribute('stroke-width', '2');
                line.setAttribute('opacity', '0.6');
                
                svg.appendChild(line);
                drawnCount++;
            });
            
            console.log(\`✅ Drew \${drawnCount} relationship lines\`);
            console.log(\`⚠️  Skipped \${skippedCount} relationships (classes not found)\`);
        }
        
        // Redraw lines on window resize
        window.addEventListener('resize', function() {
            setTimeout(drawRelationships, 100);
        });
    </script>
</body>
</html>`;
	}
}
