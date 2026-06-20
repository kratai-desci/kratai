import { GitComparisonResult } from '../types/git';

export class GitChangesView {
	
	static generate(result: GitComparisonResult, iconUri?: string): string {
		const { workspaceName, currentBranch, compareTarget, changes } = result;
		
		const totalChanges = changes.length;
		const modified = changes.filter(c => c.status === 'modified').length;
		const added = changes.filter(c => c.status === 'added').length;
		const deleted = changes.filter(c => c.status === 'deleted').length;

		const totalAdditions = changes.reduce((sum, c) => sum + (c.additions || 0), 0);
		const totalDeletions = changes.reduce((sum, c) => sum + (c.deletions || 0), 0);

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git Changes</title>
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
            background: #333;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            border-bottom: 2px solid #ccc;
            z-index: 1000;
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
        .content {
            flex: 1;
            overflow: auto;
            padding: 20px;
            min-height: 0;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            border: 2px solid #333;
            padding: 20px;
            text-align: center;
        }
        .summary-card .number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }
        .summary-card .label {
            font-size: 0.9em;
            color: #666;
            font-weight: 500;
        }
        .summary-card.modified .number { color: #f57c00; }
        .summary-card.added .number { color: #388e3c; }
        .summary-card.deleted .number { color: #d32f2f; }
        .changes-section {
            background: white;
            border: 2px solid #333;
            padding: 20px;
        }
        .changes-section h2 {
            margin: 0 0 20px 0;
            font-size: 1.2em;
            color: #333;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
        }
        .change-item {
            padding: 12px 15px;
            margin: 8px 0;
            border: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background 0.2s;
            border-left: 4px solid transparent;
        }
        .change-item:hover {
            background: #f5f5f5;
        }
        .change-item.modified { 
            border-left-color: #f57c00;
            background: #fff9c4;
        }
        .change-item.added { 
            border-left-color: #388e3c;
            background: #c8e6c9;
        }
        .change-item.deleted { 
            border-left-color: #d32f2f;
            background: #ffcdd2;
        }
        .file-path {
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #333;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .file-stats {
            display: flex;
            gap: 15px;
            align-items: center;
        }
        .status-badge {
            background: #333;
            color: white;
            padding: 4px 12px;
            font-size: 0.85em;
            font-weight: 600;
            text-transform: uppercase;
        }
        .stats-badge {
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            font-weight: 600;
        }
        .additions { color: #388e3c; }
        .deletions { color: #d32f2f; }
        .no-changes {
            text-align: center;
            padding: 60px 20px;
            color: #666;
            font-size: 1.1em;
            background: white;
            border: 2px solid #333;
        }
        .diff-summary {
            text-align: center;
            margin: 15px 0 20px 0;
            font-size: 1.1em;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <div style="display:flex;align-items:center;gap:16px">
            ${iconUri ? `<img src="${iconUri}" style="height:48px;width:48px;object-fit:contain;filter:invert(1);opacity:0.9;flex-shrink:0" />` : ''}
            <div>
                <h1>Git Changes</h1>
                <p>${workspaceName} • ${currentBranch} ← ${compareTarget} • ${totalChanges} files changed</p>
            </div>
        </div>
    </div>
    
    <div class="content">
        ${totalChanges === 0 ? `
            <div class="no-changes">
                <h2>✨ No Changes Detected</h2>
                <p>Your local branch is up to date with the remote.</p>
            </div>
        ` : `
            <div class="summary">
                <div class="summary-card">
                    <div class="number">${totalChanges}</div>
                    <div class="label">Total Changes</div>
                </div>
                <div class="summary-card modified">
                    <div class="number">${modified}</div>
                    <div class="label">Modified</div>
                </div>
                <div class="summary-card added">
                    <div class="number">${added}</div>
                    <div class="label">Added</div>
                </div>
                <div class="summary-card deleted">
                    <div class="number">${deleted}</div>
                    <div class="label">Deleted</div>
                </div>
            </div>
            
            <div class="diff-summary">
                <span class="additions">+${totalAdditions}</span> • 
                <span class="deletions">-${totalDeletions}</span>
            </div>
            
            <div class="changes-section">
                <h2>Changed Files</h2>
                ${changes.map(change => `
                    <div class="change-item ${change.status}">
                        <div class="file-path">${change.path}</div>
                        <div class="file-stats">
                            ${change.additions !== undefined && change.deletions !== undefined ? `
                                <span class="stats-badge">
                                    <span class="additions">+${change.additions}</span>
                                    <span class="deletions">-${change.deletions}</span>
                                </span>
                            ` : ''}
                            <span class="status-badge">${change.status}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    </div>
</body>
</html>`;
	}
}
