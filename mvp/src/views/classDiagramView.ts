import { ReactFlowNode, ReactFlowEdge } from '../types/diagram';

export class ClassDiagramView {
	
	static generate(nodes: ReactFlowNode[], edges: ReactFlowEdge[], workspaceName: string): string {
		// Build hierarchical folder structure
		interface FolderNode {
			name: string;
			fullPath: string;
			children: Map<string, FolderNode>;
			classes: ReactFlowNode[];
		}

		const root: FolderNode = { name: 'src', fullPath: 'src', children: new Map(), classes: [] };

		nodes.forEach(node => {
			const filePath = node.data.classInfo.filePath;
			const match = filePath.match(/src\/(.+?)\/[^\/]+\.ts$/);
			const pathParts = match ? match[1].split('/') : [];
			
			let current = root;
			let currentPath = 'src';
			
			pathParts.forEach(part => {
				currentPath += '/' + part;
				if (!current.children.has(part)) {
					current.children.set(part, {
						name: part,
						fullPath: currentPath,
						children: new Map(),
						classes: []
					});
				}
				current = current.children.get(part)!;
			});
			
			current.classes.push(node);
		});

		// Layout configuration
		const boxWidth = 250;
		const boxHeight = 170;
		const classSpacing = 18;
		const folderHeaderHeight = 32;
		const folderPadding = 12;
		const folderMargin = 15;
		
		const classPositions = new Map<string, { x: number; y: number }>();
		const folderSizes = new Map<string, { x: number; y: number; width: number; height: number }>();
		const nodeMap = new Map(nodes.map(n => [n.data.classInfo.name, n]));

		// Recursive function to calculate folder size and layout
		function layoutFolder(folder: FolderNode, x: number, y: number): { width: number; height: number } {
			let contentY = y + folderHeaderHeight + folderPadding;
			let maxWidth = 0;
			const currentX = x + folderPadding;
			
			// Layout classes in this folder
			const nodesPerRow = Math.min(4, Math.ceil(Math.sqrt(folder.classes.length)));
			folder.classes.forEach((node, index) => {
				const col = index % nodesPerRow;
				const row = Math.floor(index / nodesPerRow);
				
				const classX = currentX + col * (boxWidth + classSpacing);
				const classY = contentY + row * (boxHeight + classSpacing);
				
				classPositions.set(node.data.classInfo.name, { x: classX, y: classY });
			});
			
			const classRows = Math.ceil(folder.classes.length / nodesPerRow);
			const classAreaHeight = classRows > 0 ? classRows * boxHeight + (classRows - 1) * classSpacing : 0;
			const classAreaWidth = Math.min(nodesPerRow, folder.classes.length) * boxWidth + (Math.min(nodesPerRow, folder.classes.length) - 1) * classSpacing;
			
			if (folder.classes.length > 0) {
				contentY += classAreaHeight + folderMargin;
				maxWidth = Math.max(maxWidth, classAreaWidth);
			}
			
			// Layout child folders
			const childFolders = Array.from(folder.children.values()).sort((a, b) => a.name.localeCompare(b.name));
			childFolders.forEach(child => {
				const childSize = layoutFolder(child, currentX, contentY);
				contentY += childSize.height + folderMargin;
				maxWidth = Math.max(maxWidth, childSize.width);
			});
			
			const totalWidth = Math.max(maxWidth, 150) + folderPadding * 2;
			const totalHeight = contentY - y + folderPadding;
			
			folderSizes.set(folder.fullPath, { x, y, width: totalWidth, height: totalHeight });
			
			return { width: totalWidth, height: totalHeight };
		}
		
		// Calculate layout starting from root
		const rootSize = layoutFolder(root, 40, 40);

		// Recursive function to render folder boxes
		function renderFolder(folder: FolderNode, depth: number): string {
			const pos = folderSizes.get(folder.fullPath);
			if (!pos) return '';
			
			const opacity = Math.max(0.06, 0.12 - depth * 0.015);
			const borderOpacity = Math.max(0.25, 0.45 - depth * 0.04);
			
			const folderIcon = folder.name.includes('command') ? '⚡' : 
							   folder.name.includes('service') ? '⚙️' : 
							   folder.name.includes('view') ? '👁️' : 
							   folder.name.includes('type') ? '📝' :
							   folder.name.includes('app') ? '📱' : 
							   folder.name.includes('util') ? '🔧' : '📁';
			
			const classCount = folder.classes.length;
			const totalCount = countClasses(folder);
			
			let html = `
				<div class="folder-box" style="
					position: absolute;
					left: ${pos.x}px;
					top: ${pos.y}px;
					width: ${pos.width}px;
					height: ${pos.height}px;
					background: rgba(255, 255, 255, ${opacity});
					border: 2px solid rgba(102, 126, 234, ${borderOpacity});
					border-radius: 6px;
					backdrop-filter: blur(3px);
					z-index: ${10 - depth};
				">
					<div style="
						padding: 6px 10px;
						background: linear-gradient(135deg, rgba(102, 126, 234, ${0.18 + depth * 0.03}), rgba(118, 75, 162, ${0.18 + depth * 0.03}));
						border-radius: 4px 4px 0 0;
						color: white;
						font-weight: 600;
						font-size: 0.8em;
						display: flex;
						align-items: center;
						gap: 5px;
					">
						<span style="font-size: 1.05em;">${folderIcon}</span>
						<span>${folder.name}</span>
						${totalCount > 0 ? `<span style="
							background: rgba(255, 255, 255, 0.25);
							padding: 1px 5px;
							border-radius: 6px;
							font-size: 0.75em;
							margin-left: auto;
						">${totalCount}</span>` : ''}
					</div>
				</div>
			`;
			
			// Render child folders
			const childFolders = Array.from(folder.children.values()).sort((a, b) => a.name.localeCompare(b.name));
			childFolders.forEach(child => {
				html += renderFolder(child, depth + 1);
			});
			
			return html;
		}
		
		function countClasses(folder: FolderNode): number {
			let count = folder.classes.length;
			folder.children.forEach(child => count += countClasses(child));
			return count;
		}
		
		const folderBackgrounds = renderFolder(root, 0);

		// Generate UML boxes
		const classBoxes = nodes.map(node => {
			const classInfo = node.data.classInfo;
			const className = classInfo.name;
			const pos = classPositions.get(className) || { x: 50, y: 50 };
			
			const borderColor = classInfo.isInterface ? '#4ecdc4' : classInfo.isAbstract ? '#ff6b6b' : '#667eea';
			const borderStyle = classInfo.isInterface ? 'dashed' : 'solid';

			return `
				<div class="uml-box" data-class="${className}" style="
					position: absolute;
					left: ${pos.x}px;
					top: ${pos.y}px;
					width: ${boxWidth}px;
					background: white;
					border: 3px ${borderStyle} ${borderColor};
					border-radius: 3px;
					box-shadow: 0 2px 6px rgba(0,0,0,0.12);
					font-family: 'Courier New', monospace;
					font-size: 0.75em;
					z-index: 50;
				">
					<!-- Class name compartment -->
					<div style="
						background: ${borderColor};
						color: white;
						padding: 8px;
						text-align: center;
						font-weight: bold;
						font-size: 0.9em;
						border-radius: 0px;
					">
						${classInfo.isInterface ? '«interface»<br>' : classInfo.isAbstract ? '«abstract»<br>' : ''}${className}
					</div>
					
					<!-- Properties compartment -->
					<div style="
						padding: 6px;
						border-bottom: 1px solid ${borderColor};
						min-height: 25px;
						max-height: 65px;
						overflow: hidden;
						background: #fafafa;
						font-size: 0.78em;
					">
						${classInfo.properties.length > 0 ? classInfo.properties.slice(0, 4).map(prop => `
							<div style="padding: 1px 3px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
								<span style="color: ${prop.visibility === 'private' ? '#e74c3c' : prop.visibility === 'protected' ? '#f39c12' : '#27ae60'};">
									${prop.visibility === 'private' ? '-' : prop.visibility === 'protected' ? '#' : '+'}
								</span>
								${prop.name}
							</div>
						`).join('') : '<div style="color: #999; font-style: italic; padding: 3px;">No properties</div>'}
						${classInfo.properties.length > 4 ? `<div style="color: #999; font-style: italic; padding: 1px 3px;">+${classInfo.properties.length - 4}</div>` : ''}
					</div>
					
					<!-- Methods compartment -->
					<div style="
						padding: 6px;
						min-height: 25px;
						max-height: 65px;
						overflow: hidden;
						font-size: 0.78em;
					">
						${classInfo.methods.length > 0 ? classInfo.methods.slice(0, 4).map(method => `
							<div style="padding: 1px 3px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
								<span style="color: ${method.visibility === 'private' ? '#e74c3c' : method.visibility === 'protected' ? '#f39c12' : '#27ae60'};">
									${method.visibility === 'private' ? '-' : method.visibility === 'protected' ? '#' : '+'}
								</span>
								${method.name}()
							</div>
						`).join('') : '<div style="color: #999; font-style: italic; padding: 3px;">No methods</div>'}
						${classInfo.methods.length > 4 ? `<div style="color: #999; font-style: italic; padding: 1px 3px;">+${classInfo.methods.length - 4}</div>` : ''}
					</div>
				</div>
			`;
		}).join('');

		// Generate SVG lines for relationships
		const svgLines = edges.map(edge => {
			const sourcePos = classPositions.get(edge.source);
			const targetPos = classPositions.get(edge.target);
			if (!sourcePos || !targetPos) return '';

			// Calculate connection points (center of boxes)
			const sourceX = sourcePos.x + boxWidth / 2;
			const sourceY = sourcePos.y + boxHeight / 2;
			const targetX = targetPos.x + boxWidth / 2;
			const targetY = targetPos.y + boxHeight / 2;

			const color = edge.type === 'extends' ? '#ff6b6b' : edge.type === 'implements' ? '#4ecdc4' : '#999';
			const dashArray = edge.type === 'implements' ? '4,4' : '0';
			const markerEnd = edge.type === 'implements' ? 'url(#triangle-implements)' : 'url(#triangle-extends)';
			
			// Draw curved line for better visibility
			const midX = (sourceX + targetX) / 2;
			const midY = (sourceY + targetY) / 2;
			const dx = targetX - sourceX;
			const dy = targetY - sourceY;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const offset = Math.min(25, dist / 5);
			const controlX = midX - dy * offset / dist;
			const controlY = midY + dx * offset / dist;
			
			return `
				<path 
					d="M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}"
					stroke="${color}"
					stroke-width="1.5"
					fill="none"
					stroke-dasharray="${dashArray}"
					marker-end="${markerEnd}"
					opacity="0.7"
				/>
			`;
		}).join('');

		// Calculate canvas size
		const maxX = 40 + rootSize.width + 50;
		const maxY = 40 + rootSize.height + 50;
		
		function countFolders(folder: FolderNode): number {
			let count = 1;
			folder.children.forEach(child => count += countFolders(child));
			return count;
		}
		const totalFolders = countFolders(root);

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UML Class Diagram</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .header {
            position: sticky;
            top: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header h1 {
            margin: 0;
            font-size: 1.5em;
            color: #667eea;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 0.9em;
        }
        .stats {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 0.9em;
        }
        .search-box {
            margin: 0 20px;
            flex: 1;
            max-width: 400px;
        }
        .search-box input {
            width: 100%;
            padding: 10px;
            border: 2px solid #667eea;
            border-radius: 8px;
            font-size: 0.9em;
        }
        .diagram-container {
            position: relative;
            width: ${maxX}px;
            height: ${maxY}px;
            margin: 30px;
            transform-origin: top left;
        }
        .uml-box {
            transition: all 0.2s;
            cursor: pointer;
        }
        .uml-box:hover {
            transform: scale(1.05);
            z-index: 200 !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
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
            border: none;
            background: #667eea;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
        }
        .zoom-controls button:hover {
            background: #5568d3;
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
            <h1>📊 UML Class Diagram</h1>
            <p>${workspaceName} • ${nodes.length} classes • ${edges.length} relationships</p>
        </div>
        <div class="search-box">
            <input type="text" id="search" placeholder="Search classes..." oninput="filterClasses(this.value)">
        </div>
        <div class="stats">
            ${totalFolders} folders
        </div>
    </div>
    
    <div class="zoom-controls">
        <button onclick="zoomIn()">🔍 Zoom In</button>
        <button onclick="zoomOut()">🔍 Zoom Out</button>
        <button onclick="resetZoom()">↺ Reset</button>
    </div>
    
    <div class="legend">
        <div style="font-weight: 600; margin-bottom: 8px;">Relationships</div>
        <div class="legend-item">
            <div class="legend-line" style="background: #ff6b6b;"></div>
            <span>Extends</span>
        </div>
        <div class="legend-item">
            <div class="legend-line" style="background: #4ecdc4; border-bottom: 2px dashed #4ecdc4;"></div>
            <span>Implements</span>
        </div>
    </div>
    
    <div style="overflow: auto; height: calc(100vh - 100px); background: rgba(255,255,255,0.05);" id="diagram-scroll">
        <div class="diagram-container" id="diagram">
            <svg width="${maxX}" height="${maxY}" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 2;">
                <defs>
                    <marker id="triangle-extends" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                        <polygon points="0,0 0,8 8,4" fill="#ff6b6b" />
                    </marker>
                    <marker id="triangle-implements" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                        <polygon points="0,0 0,8 8,4" fill="#4ecdc4" />
                    </marker>
                </defs>
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
        
        function filterClasses(searchTerm) {
            const term = searchTerm.toLowerCase();
            const boxes = document.querySelectorAll('.uml-box');
            
            boxes.forEach(box => {
                const className = box.getAttribute('data-class');
                if (!term || className.toLowerCase().includes(term)) {
                    box.style.display = 'block';
                } else {
                    box.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>`;
	}
}
