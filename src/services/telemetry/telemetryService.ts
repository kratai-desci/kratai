import { TelemetryReporter } from '@vscode/extension-telemetry';
import * as fs from 'fs';
import * as path from 'path';

interface ExtensionConfig {
	telemetry?: {
		connectionString?: string;
	};
}

function loadConfig(): ExtensionConfig {
	try {
		const configPath = path.join(__dirname, '..', '..', 'config.json');
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

let reporter: TelemetryReporter | undefined;

export class TelemetryService {

	static initialize(connectionString?: string): void {
		try {
			const key = connectionString || CONNECTION_STRING;
			if (!key) { return; } // No connection string — telemetry disabled silently
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

	static trackError(command: string, error: string): void {
		reporter?.sendTelemetryErrorEvent('error', { command, error });
	}
}
