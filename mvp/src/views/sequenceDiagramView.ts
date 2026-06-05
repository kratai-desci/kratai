import { SequenceData } from '../services/methodTracerService';

export class SequenceDiagramView {
	
	static generate(
		className: string,
		methodName: string,
		filePath: string,
		sequenceData: SequenceData
	): string {
		const diagramHTML = this.generateSequenceDiagramHTML(className, methodName, sequenceData);
		
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sequence Diagram - ${className}.${methodName}()</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        body {
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
            background: #f5f5f5;
            display: flex;
            flex-direction: column;
        }
        .header {
            flex-shrink: 0;
            background: white;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border-bottom: 2px solid #333;
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
            border: 2px solid #333;
            background: white;
            color: #333;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: 500;
        }
        .header-controls button:hover {
            background: #f0f0f0;
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
        .content {
            flex: 1;
            position: relative;
            padding: 0;
            overflow: auto;
            background: #f5f5f5;
            min-height: 0;
        }
        .sequence-diagram {
            width: 100%;
            min-height: 400px;
            transform-origin: top left;
        }
        .sequence-diagram svg {
            width: 100%;
            height: auto;
            display: block;
        }
        .lifeline {
            stroke: #999;
            stroke-width: 2;
            stroke-dasharray: 8, 4;
        }
        .call-arrow {
            stroke: #333;
            stroke-width: 2.5;
            fill: none;
        }
        .arrowhead {
            fill: #333;
        }
        .return-arrow {
            stroke: #666;
            stroke-width: 2;
            stroke-dasharray: 6, 4;
            fill: none;
        }
        .return-arrowhead {
            fill: #666;
        }
        .actor-text {
            font-size: 13px;
            font-weight: 600;
            fill: #333;
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
        }
        .message-number {
            font-size: 12px;
            font-weight: 700;
            fill: #333;
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
        }
        .message-text {
            font-size: 11px;
            fill: #333;
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif;
        }
        .empty-state {
            text-align: center;
            padding: 60px 40px;
            color: #666;
        }
        .empty-state h2 {
            color: #333;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>🔄 Sequence Diagram</h1>
            <p>${className}.${methodName}() • ${sequenceData.actors.size} actors • ${sequenceData.calls.length} calls • max depth: ${sequenceData.maxDepth}</p>
        </div>
        <div class="header-controls">
            <button onclick="zoomIn()">🔍 Zoom In</button>
            <button onclick="zoomOut()">🔍 Zoom Out</button>
            <button onclick="resetZoom()">↺ Reset</button>
        </div>
    </div>
    
    <div class="content">
        ${diagramHTML}
    </div>
</body>
</html>`;
	}
	
	/**
	 * Generate custom HTML/CSS/SVG sequence diagram
	 */
	private static generateSequenceDiagramHTML(
		startClass: string,
		startMethod: string,
		sequenceData: SequenceData
	): string {
		if (sequenceData.calls.length === 0) {
			return `
				<div class="empty-state">
					<h2>No Method Calls Found</h2>
					<p>This method doesn't call any other methods in the selected folders.</p>
				</div>
			`;
		}
		
		// Ensure starting class is first, then sort the rest
		const actorsArray = Array.from(sequenceData.actors);
		const actors: string[] = [];
		
		// Add starting class first
		if (actorsArray.includes(startClass)) {
			actors.push(startClass);
		}
		
		// Add remaining actors sorted
		actorsArray
			.filter(actor => actor !== startClass)
			.sort()
			.forEach(actor => actors.push(actor));
		
		const actorCount = actors.length;
		const actorWidth = 220; // Width for each actor column
		const messageHeight = 70; // Vertical space per message
		const leftMargin = 80; // Left margin
		
		// Calculate positions for each actor (centered on their lifeline)
		const actorPositions = new Map<string, number>();
		actors.forEach((actor, index) => {
			const centerX = leftMargin + index * actorWidth + actorWidth / 2;
			actorPositions.set(actor, centerX);
		});
		
		// Calculate total dimensions
		const totalHeight = sequenceData.calls.length * messageHeight + 300;
		const diagramWidth = actorCount * actorWidth + leftMargin * 2;
		
		// Generate SVG content
		let svgContent = '';
		
		// Generate lifelines (vertical dashed lines from each actor)
		actors.forEach(actor => {
			const xPos = actorPositions.get(actor)!;
			// Start at bottom of top actor box (y=80) and end at top of bottom actor box
			svgContent += `<line x1="${xPos}" y1="80" x2="${xPos}" y2="${totalHeight - 80}" class="lifeline"/>`;
		});
		
		// Generate actor boxes at top (inside SVG)
		actors.forEach(actor => {
			const xPos = actorPositions.get(actor)!;
			const boxWidth = 160;
			const boxX = xPos - boxWidth / 2;
			
			// Truncate long actor names
			const displayName = actor.length > 20 ? actor.substring(0, 18) + '...' : actor;
			
			svgContent += `
				<rect x="${boxX}" y="20" width="${boxWidth}" height="60" fill="white" stroke="#333" stroke-width="2"/>
				<text x="${xPos}" y="55" text-anchor="middle" class="actor-text" title="${this.escapeHtml(actor)}">${this.escapeHtml(displayName)}</text>
			`;
		});
		
		// Generate messages (method calls and returns)
		let messageNumber = 1;
		
		sequenceData.calls.forEach((call, index) => {
			const yPos = 140 + index * messageHeight;
			const fromX = actorPositions.get(call.fromClass)!;
			const toX = actorPositions.get(call.toClass)!;
			
			// Truncate long method names
			const methodDisplay = call.toMethod.length > 18 ? call.toMethod.substring(0, 16) + '..' : call.toMethod;
			
			if (fromX === toX) {
				// Self-call (method calling itself)
				const loopWidth = 60;
				svgContent += `
					<!-- Self-call: ${call.toMethod} -->
					<path d="M ${fromX} ${yPos} L ${fromX + loopWidth} ${yPos} L ${fromX + loopWidth} ${yPos + 30} L ${fromX} ${yPos + 30}" 
						  fill="none" stroke="#333" stroke-width="2"/>
					<polygon points="${fromX},${yPos + 30 - 4} ${fromX - 5},${yPos + 30} ${fromX},${yPos + 30 + 4}" fill="#333"/>
					
					<!-- Label -->
				<rect x="${fromX + 10}" y="${yPos - 15}" width="100" height="22" fill="white" stroke="#666" stroke-width="1"/>
					<text x="${fromX + 15}" y="${yPos}" class="message-number">${messageNumber}.</text>
					<text x="${fromX + 28}" y="${yPos}" class="message-text" title="${this.escapeHtml(call.toMethod)}()">${this.escapeHtml(methodDisplay)}()</text>
				`;
			} else {
				const direction = toX > fromX ? 1 : -1;
				const midX = (fromX + toX) / 2;
				
				// Call arrow (solid line with arrowhead)
				svgContent += `
					<!-- Call: ${call.fromMethod} to ${call.toMethod} -->
					<line x1="${fromX}" y1="${yPos}" x2="${toX - (direction * 8)}" y2="${yPos}" class="call-arrow"/>
					<polygon points="${toX - (direction * 8)},${yPos - 5} ${toX},${yPos} ${toX - (direction * 8)},${yPos + 5}" class="arrowhead"/>
					
					<!-- Message number and label -->
					<rect x="${midX - 60}" y="${yPos - 18}" width="120" height="22" fill="white" stroke="#666" stroke-width="1"/>
					<text x="${midX - 55}" y="${yPos - 2}" class="message-number">${messageNumber}.</text>
					<text x="${midX - 40}" y="${yPos - 2}" class="message-text" title="${this.escapeHtml(call.toMethod)}()">${this.escapeHtml(methodDisplay)}()</text>
					
					<!-- Activation bar on target -->
					<rect x="${toX - 6}" y="${yPos}" width="12" height="${messageHeight - 25}" fill="#e8e8e8" stroke="#333" stroke-width="1.5"/>
				`;
				
				// Return arrow (dashed line)
				const returnY = yPos + messageHeight - 25;
				svgContent += `
					<line x1="${toX}" y1="${returnY}" x2="${fromX + (direction * 8)}" y2="${returnY}" class="return-arrow"/>
					<polygon points="${fromX + (direction * 8)},${returnY - 4} ${fromX},${returnY} ${fromX + (direction * 8)},${returnY + 4}" class="return-arrowhead"/>
				`;
			}
			
			messageNumber++;
		});
		
		// Generate actor boxes at bottom (mirrored)
		actors.forEach(actor => {
			const xPos = actorPositions.get(actor)!;
			const boxWidth = 160;
			const boxX = xPos - boxWidth / 2;
			const boxY = totalHeight - 80;
			
			// Truncate long actor names
			const displayName = actor.length > 20 ? actor.substring(0, 18) + '...' : actor;
			
			svgContent += `
				<rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="60" fill="white" stroke="#333" stroke-width="2"/>
				<text x="${xPos}" y="${boxY + 35}" text-anchor="middle" class="actor-text" title="${this.escapeHtml(actor)}">${this.escapeHtml(displayName)}</text>
			`;
		});
		
		return `
			<div class="sequence-diagram" id="sequenceDiagram">
				<svg width="${diagramWidth}" height="${totalHeight}" viewBox="0 0 ${diagramWidth} ${totalHeight}" preserveAspectRatio="xMidYMid meet">
					${svgContent}
				</svg>
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
					const diagram = document.getElementById('sequenceDiagram');
					diagram.style.transform = 'scale(' + currentZoom + ')';
					diagram.style.transformOrigin = 'top left';
				}
			</script>
		`;
	}
	
	private static escapeHtml(text: string): string {
		const map: { [key: string]: string } = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, m => map[m]);
	}
}
