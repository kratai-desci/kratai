# Kratai MCP Server

Model Context Protocol server for Kratai - provides AI agents access to architecture diagrams.

## Features

### Available Tools

#### 1. `kratai_list_diagrams`
List all available architecture diagrams in the workspace.

**Returns:**
```json
[
  {
    "id": "full-diagram",
    "name": "Full diagram",
    "lastGenerated": "2026-06-25T10:30:00Z"
  },
  {
    "id": "domain-model",
    "name": "Domain model",
    "lastGenerated": "2026-06-24T15:20:00Z"
  }
]
```

#### 2. `kratai_get_diagram`
Get complete architecture diagram as markdown.

**Parameters:**
- `diagramId` (required): Diagram ID from `kratai_list_diagrams`

**Returns:** Full markdown document with:
- Summary statistics
- Symbol legend (visibility, git status)
- All classes with properties, methods, file paths, line numbers
- All relationships with metadata
- Git diff status (if enabled)

## Usage

### VS Code (Automatic)

The MCP server is automatically available when you install the Kratai extension. Compatible AI tools will discover it automatically.

### Standalone CLI

Install globally:
```bash
npm install -g kratai
```

Configure in your MCP client (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "kratai": {
      "command": "kratai-mcp",
      "args": ["/path/to/your/workspace"]
    }
  }
}
```

### Test Locally

```bash
cd /path/to/your/workspace
npx kratai-mcp .
```

## How It Works

1. **Reads saved diagram configurations** from `.vscode/kratai/*.json`
2. **Generates diagrams on-demand** using Kratai's parsers
3. **Exports as markdown** with full class/relationship details
4. **Communicates via stdin/stdout** following MCP protocol

## Architecture

```
src/
  mcp/
    server.ts          # Main MCP server
  services/
    view/              # View management
    parsing/           # Code parsers
    export/            # Markdown exporter
```

## Requirements

- Node.js 16+
- Workspace with Kratai diagrams configured

## Development

Build:
```bash
npm run compile
```

Test:
```bash
# Terminal 1: Start server
node out/mcp/server.js /path/to/workspace

# Terminal 2: Send MCP request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node out/mcp/server.js /path/to/workspace
```

## See Also

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Kratai Documentation](https://kratai.com)
