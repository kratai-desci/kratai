# Kratai MCP Server

Model Context Protocol server for Kratai - provides AI agents with instant codebase architecture overview to support clean architecture thinking.

## Purpose

**Kratai MCP enables architecture-aware engineering** by giving AI agents a complete view of your codebase structure in one call, instead of reading hundreds of files.

**Think of it as:** X-ray vision for your codebase. Instead of reading file-by-file, AI sees the entire architecture pattern instantly: classes, responsibilities, dependencies, coupling points.

**Use case:** AI applies clean architecture principles (SRP, DRY, KISS, cohesion, coupling) by understanding existing patterns FIRST, then coding to match them.

---

## Features

### Available Tools

#### 1. `kratai_list_diagrams`
List all available architecture diagrams in the workspace.

**Use:** First call in every session to check existing diagrams.

**Returns:**
```json
[
  {
    "id": "overview-2026-07-05",
    "name": "Full Architecture Overview",
    "lastGenerated": "2026-07-05T10:30:00Z"
  }
]
```

#### 2. `kratai_get_diagram`
Get complete architecture diagram as optimized markdown.

**Use:** Get fresh architecture overview (never stale - regenerated on demand).

**Parameters:**
- `diagramId` (required): Diagram ID from `kratai_list_diagrams`

**Returns:** Ultra-compact markdown with:
- Project folder structure (tree view)
- All classes with methods, properties, types
- All relationships (Uses, Used By) integrated per class
- Zero file paths (just class names for token efficiency)
- Zero line numbers (architecture, not navigation)
- Optimized for LLM consumption (~60% fewer tokens than traditional diagrams)

**Why this format:**
- Single-line relationships (not multi-line lists)
- No decorative markdown (plain text where possible)  
- Grouped by file (no repetition)
- Maximum information density for line-based context windows

#### 3. `kratai_create_overview_diagram`
Creates a complete architecture overview of the entire codebase.

**Use:** When no diagrams exist (first time) or need fresh snapshot after major refactoring.

**Auto-detects:**
- All source folders
- All supported languages
- All classes, methods, relationships
- Framework patterns (Next.js, Django, Spring Boot)
- HTTP endpoints and async calls

**Returns:** Complete architecture markdown + saves diagram for future use

---

## Usage Philosophy

### For AI Agents

**Kratai tools are support tools, not the main skill.** The main skill is **architecture-aware engineering** (SRP, DRY, KISS, cohesion, coupling).

**Workflow:**
1. **Session start:** Call `kratai_list_diagrams` + `kratai_get_diagram` ONCE
2. **Cache architecture** in working memory (patterns, structure, conventions)
3. **Apply principles** on every coding task using cached knowledge
4. **Refresh diagram** only when: major refactoring or many new files

**Anti-pattern:**
- ❌ Calling `kratai_get_diagram` for every single task (wasteful)
- ❌ Reading diagram JSON files directly (stale data)
- ✅ Call once, cache, reuse knowledge for entire session

### For Users

**VS Code Integration (Automatic):**

The MCP server is automatically available when you install the Kratai extension. Compatible AI tools will discover it automatically.

**Standalone CLI:**

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

**Test Locally:**

```bash
cd /path/to/your/workspace
npx kratai-mcp .
```

---

## How It Works

1. **Reads saved diagram configurations** from `.vscode/kratai/*.json`
2. **Generates diagrams on-demand** using Kratai's parsers (never stale)
3. **Exports as ultra-compact markdown** optimized for LLM consumption
4. **Communicates via stdin/stdout** following MCP protocol

## Requirements

- Node.js 16+
- Workspace to analyze (no pre-configuration needed)

---

## Verify MCP Server is Working

### Quick Test in AI Chat

```typescript
// Search for Kratai tools
tool_search("kratai")

// Should return 3 tools:
// - kratai_list_diagrams
// - kratai_get_diagram  
// - kratai_create_overview_diagram
```

### If Tools Not Found

**Check MCP Configuration:**

For Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "kratai": {
      "command": "node",
      "args": [
        "/path/to/kratai/dist/mcp/server.mjs",
        "/path/to/your/workspace"
      ]
    }
  }
}
```

**Troubleshooting Steps:**

1. **Verify server path exists:**
   ```bash
   ls /path/to/kratai/dist/mcp/server.mjs
   ```

2. **Test server manually:**
   ```bash
   cd /your/workspace
   node /path/to/kratai/dist/mcp/server.mjs .
   # Should start without errors
   ```

3. **Check server logs:**
   - Look for `[Kratai MCP]` prefix in console
   - Errors appear as `Error in [tool]: ...`

4. **Restart AI client** after configuration changes

5. **Verify workspace path is correct** (absolute path required)

### Common Issues

**"Cannot find module"**
- Run `npm run compile` in kratai directory
- Verify `dist/` folder exists

**"Diagram not found"**
- No saved diagrams exist yet
- Use `kratai_create_overview_diagram()` to generate first diagram

**"Parsing timeout"**
- Codebase too large (>10,000 files)
- Create focused diagrams with folder filters instead

---

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
