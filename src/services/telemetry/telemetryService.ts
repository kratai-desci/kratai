import * as fs from 'fs';
import * as path from 'path';

interface ExtensionConfig {
	telemetry?: {
		connectionString?: string;
	};
}

function loadConfig(): ExtensionConfig {
	try {
		// Go up 3 levels from out/services/telemetry/ to reach project root
		const configPath = path.join(__dirname, '..', '..', '..', 'config.json');
		if (fs.existsSync(configPath)) {
			return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		}
	} catch {
		// Config file missing or invalid — telemetry will be disabled
	}
	return {};
}

const config = loadConfig();
const CONNECTION_STRING = config.telemetry?.connectionString || '';

let reporter: any | undefined;
let isVSCodeContext = false;

// Detect if we're running in VS Code context
try {
	require.resolve('vscode');
	isVSCodeContext = true;
} catch {
	// Not in VS Code context (e.g., standalone Node.js / MCP server)
	isVSCodeContext = false;
}

export class TelemetryService {

	static async initialize(connectionString?: string): Promise<void> {
		try {
			// Skip telemetry if not in VS Code context (e.g., MCP server)
			if (!isVSCodeContext) {
				return;
			}

			const key = connectionString || CONNECTION_STRING;
			if (!key) { return; } // No connection string — telemetry disabled silently
			
			// Dynamic import to avoid loading vscode module in Node.js context
			const { TelemetryReporter } = await import('@vscode/extension-telemetry');
			reporter = new TelemetryReporter(key);
		} catch (e) {
			// Telemetry init failure should never crash the extension
		}
	}

	static dispose(): void {
		reporter?.dispose();
		reporter = undefined;
	}

	// Feature usage events
	static trackGenerateClassDiagram(classCount: number, folderCount: number, relationshipCount: number): void {
		reporter?.sendTelemetryEvent('generateClassDiagram', {}, {
			classCount,
			folderCount,
			relationshipCount
		});
	}

	static trackShowGitChanges(changedFiles: number): void {
		reporter?.sendTelemetryEvent('showGitChanges', {}, {
			changedFiles
		});
	}

	static trackOpenCommunity(): void {
		reporter?.sendTelemetryEvent('openCommunity');
	}

	static trackOpenSettings(): void {
		reporter?.sendTelemetryEvent('openSettings');
	}

	// MCP Server usage events
	static trackMcpListDiagrams(diagramCount: number): void {
		reporter?.sendTelemetryEvent('mcpListDiagrams', {}, {
			diagramCount
		});
	}

	static trackMcpGetDiagram(classCount: number, relationshipCount: number): void {
		reporter?.sendTelemetryEvent('mcpGetDiagram', {}, {
			classCount,
			relationshipCount
		});
	}

	static trackMcpCreateDiagram(classCount: number, relationshipCount: number, folderCount: number): void {
		reporter?.sendTelemetryEvent('mcpCreateDiagram', {}, {
			classCount,
			relationshipCount,
			folderCount
		});
	}

	static trackError(command: string, error: string): void {
		reporter?.sendTelemetryErrorEvent('error', { command, error });
	}
}
