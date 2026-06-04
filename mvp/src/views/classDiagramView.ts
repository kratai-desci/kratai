import { ReactFlowNode, ReactFlowEdge } from '../types/diagram';
import { FolderStructureBuilder } from './components/folderStructure';
import { HierarchicalLayoutCalculator, LayoutConfig } from './components/layoutCalculator';
import { ClassBoxRenderer } from './components/classBoxRenderer';
import { FolderBoxRenderer } from './components/folderBoxRenderer';
import { RelationshipRenderer } from './components/relationshipRenderer';

export class ClassDiagramView {
	
	static generate(nodes: ReactFlowNode[], edges: ReactFlowEdge[], workspaceName: string): string {
		// Step 1: Build folder structure
		const root = FolderStructureBuilder.build(nodes);
		console.log('=== Folder Structure ===');
		FolderStructureBuilder.logStructure(root);

		// Step 2: Configure layout
		const config: LayoutConfig = {
			boxWidth: 260,
			boxHeight: 180,
			classSpacing: 20,
			folderHeaderHeight: 40,
			folderPadding: 20,
			folderMargin: 25
		};

		// Step 3: Calculate layout
		const layoutCalc = new HierarchicalLayoutCalculator(config);
		const rootSize = layoutCalc.calculate(root, 40, 40);
		const { width: maxX, height: maxY } = layoutCalc.getCanvasSize(rootSize);

		console.log(`\n=== Layout Calculation Complete ===`);
		console.log(`Positions stored in layoutCalc: ${layoutCalc.getStoredPositionsCount()}`);
		console.log(`Total nodes to render: ${nodes.length}`);
		
		// Check for duplicate file paths in nodes
		const filePathCounts = new Map<string, number>();
		nodes.forEach(node => {
			const path = node.data.classInfo.filePath;
			filePathCounts.set(path, (filePathCounts.get(path) || 0) + 1);
		});
		const duplicates = Array.from(filePathCounts.entries()).filter(([_, count]) => count > 1);
		if (duplicates.length > 0) {
			console.warn(`\n⚠️ ${duplicates.length} file paths have multiple classes:`);
			duplicates.slice(0, 5).forEach(([path, count]) => console.warn(`  ${path}: ${count} classes`));
		}

		// Step 4: Collect all computed positions/sizes
		const folderSizesMap = new Map<string, any>();
		const collectFolderSizes = (folder: any): void => {
			const size = layoutCalc.getFolderSize(folder.fullPath);
			if (size) folderSizesMap.set(folder.fullPath, size);
			folder.children.forEach((child: any) => collectFolderSizes(child));
		};
		collectFolderSizes(root);

		const classPositionsMap = new Map<string, any>();
		const missingPositions: Array<{name: string, path: string}> = [];
		
		nodes.forEach(node => {
			// Use composite key (filePath:className) for uniqueness
			const pos = layoutCalc.getClassPosition(node.data.classInfo.filePath, node.data.classInfo.name);
			const compositeKey = `${node.data.classInfo.filePath}:${node.data.classInfo.name}`;
			if (pos) {
				classPositionsMap.set(compositeKey, pos);
			} else {
				missingPositions.push({name: node.data.classInfo.name, path: node.data.classInfo.filePath});
			}
		});

		console.log(`\n=== Class Positions Map ===`);
		console.log(`Total positions stored: ${classPositionsMap.size}/${nodes.length}`);
		if (classPositionsMap.size === 0) {
			console.error('⚠️ NO POSITIONS FOUND! classPositionsMap is empty!');
		} else if (classPositionsMap.size < nodes.length) {
			console.warn(`⚠️ MISSING ${nodes.length - classPositionsMap.size} positions!`);
			console.warn(`Missing classes (first 10):`);
			missingPositions.slice(0, 10).forEach(m => console.warn(`  - ${m.name} @ ${m.path}`));
		} else {
			console.log('✅ All classes have positions!');
		}
		// Log first 3 positions with file paths
		let count = 0;
		for (const [filePath, pos] of classPositionsMap.entries()) {
			if (count++ < 3) {
				console.log(`  ${filePath}: (${pos.x}, ${pos.y})`);
			}
		}

		// Step 5: Render all components
		const classRenderer = new ClassBoxRenderer(config.boxWidth);
		const folderRenderer = new FolderBoxRenderer();
		const relationshipRenderer = new RelationshipRenderer(config.boxWidth, config.boxHeight);

		console.log(`\n=== Rendering Components ===`);
		const classBoxes = nodes.map(node => {
			// Use composite key (filePath:className) for uniqueness
			const compositeKey = `${node.data.classInfo.filePath}:${node.data.classInfo.name}`;
			const pos = classPositionsMap.get(compositeKey);
			if (!pos) {
				console.warn(`  ⚠️ No position for: ${node.data.classInfo.name} (${node.data.classInfo.filePath})`);
				return '';
			}
			return classRenderer.render(node.data.classInfo, pos);
		}).join('');
		
		const renderedCount = nodes.filter(n => {
			const key = `${n.data.classInfo.filePath}:${n.data.classInfo.name}`;
			return classPositionsMap.has(key);
		}).length;
		console.log(`Rendered ${renderedCount}/${nodes.length} class boxes`);
		
		const folderBackgrounds = folderRenderer.renderAll(root, folderSizesMap);
		
		// Build a map for relationship rendering (edges use class names)
		// Convert composite keys back to class names
		const positionsByName = new Map<string, any>();
		for (const [compositeKey, pos] of classPositionsMap.entries()) {
			// compositeKey format: "filePath:className"
			const className = compositeKey.split(':').pop()!;
			// If duplicate names exist, last one wins (OK for relationships)
			positionsByName.set(className, pos);
		}
		
		const svgLines = relationshipRenderer.renderAll(edges, positionsByName);
		const svgDefs = relationshipRenderer.renderMarkerDefs();

		const totalFolders = FolderStructureBuilder.countFolders(root);

		// Debug: log HTML lengths
		console.log(`\n=== Generated HTML ===`);
		console.log(`Folder backgrounds: ${folderBackgrounds.length} chars`);
		console.log(`Class boxes: ${classBoxes.length} chars`);
		console.log(`SVG lines: ${svgLines.length} chars`);
		console.log(`Canvas size: ${maxX}x${maxY}`);
		
		// Debug: Check if positions are in the HTML
		const firstClassHtml = classBoxes.substring(0, 500);
		const leftMatch = firstClassHtml.match(/left:\s*(\d+)px/);
		const topMatch = firstClassHtml.match(/top:\s*(\d+)px/);
		if (leftMatch && topMatch) {
			console.log(`First class HTML has position: left=${leftMatch[1]}px, top=${topMatch[1]}px`);
		} else {
			console.error(`⚠️ No position styles found in generated HTML!`);
		}

		// Step 6: Generate final HTML
		return this.generateHTML(
			workspaceName,
			nodes.length,
			edges.length,
			totalFolders,
			maxX,
			maxY,
			folderBackgrounds,
			classBoxes,
			svgLines,
			svgDefs
		);
	}

	private static generateHTML(
		workspaceName: string,
		classCount: number,
		edgeCount: number,
		folderCount: number,
		maxX: number,
		maxY: number,
		folderBackgrounds: string,
		classBoxes: string,
		svgLines: string,
		svgDefs: string
	): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hierarchical Class Diagram</title>
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
            position: relative;
            width: ${maxX}px;
            height: ${maxY}px;
            margin: 30px;
            transform-origin: top left;
            background: white;
            border: none;
            min-width: 800px;
            min-height: 600px;
        }
        .uml-box {
            transition: all 0.2s;
            cursor: pointer;
        }
        .uml-box:hover {
            transform: scale(1.05);
            z-index: 200 !important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .folder-box {
            transition: opacity 0.2s;
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
        .zoom-controls button.debug {
            background: #dc3545;
            color: white;
            border-color: #dc3545;
            margin-top: 10px;
        }
        .zoom-controls button.debug:hover {
            background: #c82333;
            border-color: #c82333;
        }
        .legend {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1001;
            font-size: 0.85em;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 5px 0;
        }
        .legend-line {
            width: 30px;
            height: 2px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>📊 Hierarchical Class Diagram</h1>
            <p>${workspaceName} • ${classCount} classes/modules • ${edgeCount} relationships</p>
        </div>
        <div class="stats">
            ${folderCount} folders
        </div>
    </div>
    
    <div class="zoom-controls">
        <button onclick="zoomIn()">🔍 Zoom In</button>
        <button onclick="zoomOut()">🔍 Zoom Out</button>
        <button onclick="resetZoom()">↺ Reset</button>
        <button onclick="toggleDebug()" class="debug">🐛 Debug</button>
    </div>
    
    <div class="legend">
        <div style="font-weight: 600; margin-bottom: 8px; color: #333;">Relationships</div>
        <div class="legend-item">
            <div class="legend-line" style="background: #000; height: 2px;"></div>
            <span>Extends</span>
        </div>
        <div class="legend-item">
            <div class="legend-line" style="border-bottom: 2px dashed #000; height: 0;"></div>
            <span>Implements</span>
        </div>
        <div class="legend-item">
            <div class="legend-line" style="border-bottom: 2px dotted #666; height: 0;"></div>
            <span>Uses</span>
        </div>
    </div>
    
    <div style="overflow: auto; height: calc(100vh - 100px); background: #f5f5f5;" id="diagram-scroll">
        <!-- Debug Info Panel -->
        <div id="debug-panel" style="display: none; position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 8px; z-index: 10000; font-family: monospace; font-size: 11px; max-width: 300px;">
            <strong>🐛 Render Debug</strong><br/>
            Classes: ${classCount}<br/>
            Folders: ${folderCount}<br/>
            Canvas: ${maxX}x${maxY}px<br/>
            HTML Lengths:<br/>
            - Folders: ${folderBackgrounds.length} chars<br/>
            - Classes: ${classBoxes.length} chars<br/>
            - SVG: ${svgLines.length} chars<br/>
            <br/>
            <small>If all are 0, HTML generation failed!</small>
        </div>
        
        <div class="diagram-container" id="diagram">
            <svg width="${maxX}" height="${maxY}" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 50;">
                ${svgDefs}
                ${svgLines}
            </svg>
            ${folderBackgrounds}
            ${classBoxes}
        </div>
    </div>
    
    <script>
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
        }
        
        let debugMode = false;
        function toggleDebug() {
            debugMode = !debugMode;
            const debugPanel = document.getElementById('debug-panel');
            const folders = document.querySelectorAll('.folder-box');
            const boxes = document.querySelectorAll('.uml-box');
            
            if (debugMode) {
                debugPanel.style.display = 'block';
                folders.forEach(f => {
                    f.style.border = '3px solid red';
                    f.style.background = 'rgba(255, 0, 0, 0.1)';
                });
                boxes.forEach(b => {
                    b.style.outline = '2px solid lime';
                });
            } else {
                debugPanel.style.display = 'none';
                folders.forEach(f => {
                    f.style.border = '';
                    f.style.background = '';
                });
                boxes.forEach(b => {
                    b.style.outline = '';
                });
            }
        }
        
        // Log debug info on load
        window.addEventListener('load', function() {
            console.log('=== Class Diagram Debug Info ===');
            console.log('Total classes:', document.querySelectorAll('.uml-box').length);
            console.log('Total folders:', document.querySelectorAll('.folder-box').length);
            console.log('Canvas size:', '${maxX}x${maxY}');
            
            document.querySelectorAll('.uml-box').forEach((box, idx) => {
                const className = box.getAttribute('data-class');
                console.log(\`Class \${idx + 1}: \${className} at (\${box.style.left}, \${box.style.top})\`);
            });
        });
    </script>
</body>
</html>`;
	}
}
