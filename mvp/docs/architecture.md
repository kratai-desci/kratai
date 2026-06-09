# MVP Architecture

## Overview

Clean, scalable architecture separating concerns into distinct layers for maintainability and extensibility. Uses the **Strategy Pattern** for multi-language code parsing to enable easy addition of new programming languages.

## Structure

```
src/
├── extension.ts                     # Entry point - registers commands
├── commands/                        # Command handlers
│   ├── generateClassDiagram.ts     # Main diagram generation
│   ├── showConfigPanel.ts          # Configuration UI
│   └── ...
├── services/                        # Business logic
│   ├── codeParserService.ts        # Orchestrates parsing (path normalization)
│   ├── gitDiffService.ts           # Git operations
│   ├── gitDiffEnricher.ts          # Enriches diagram with git changes
│   ├── diagramGeneratorService.ts  # Generates diagram data
│   ├── configService.ts            # Configuration management
│   └── parsers/                    # Language-specific parsers (Strategy Pattern)
│       ├── IParserStrategy.ts      # Parser interface
│       ├── ParserFactory.ts        # Parser registry
│       ├── TypeScriptParser.ts     # TypeScript/TSX parser
│       └── JavaScriptParser.ts     # JavaScript/JSX parser
├── views/                           # UI HTML generators
│   ├── classDiagramView.ts         # Main diagram webview
│   ├── configPanelView.ts          # Configuration webview
│   └── components/                 # View helpers
│       └── folderStructure.ts      # Folder hierarchy builder
└── types/                           # TypeScript interfaces
    ├── diagram.ts                  # ClassInfo, DiagramData, etc.
    └── config.ts                   # KrataiConfig
```

## Layers

### 1. Extension Layer (`extension.ts`)
- **Responsibility**: Command registration and lifecycle management
- **Dependencies**: Commands
- **Role**: Entry point, activates extension, registers VS Code commands

### 2. Commands Layer (`commands/`)
- **Responsibility**: Handle command execution, orchestrate services, manage webviews
- **Dependencies**: Services, Views, Types
- **Role**: Coordinate between VS Code API, services, and views
- **Example**: `generateClassDiagram.ts` - orchestrates parsing, git diff, filtering, and diagram generation

### 3. Services Layer (`services/`)
- **Responsibility**: Business logic and external integrations
- **Dependencies**: Types, Parsers (for CodeParserService)
- **Role**: Code parsing, git operations, configuration, diagram data generation
- **Key Services**:
  - `codeParserService.ts` - Orchestrates parsing across languages, **normalizes paths once**
  - `gitDiffService.ts` - All git operations (runs from git root)
  - `gitDiffEnricher.ts` - Matches git changes to classes/members
  - `configService.ts` - Configuration loading and validation

### 4. Parsers Layer (`services/parsers/`)
- **Responsibility**: Language-specific code parsing (Strategy Pattern)
- **Dependencies**: Types
- **Role**: Extract classes, methods, properties, relationships from source code
- **Interface**: `IParserStrategy` defines contract for all parsers
- **Factory**: `ParserFactory` maps file extensions to parsers

### 5. Views Layer (`views/`)
- **Responsibility**: Generate webview HTML with embedded JavaScript
- **Dependencies**: Types
- **Role**: Pure presentation logic, no business rules
- **Example**: `classDiagramView.ts` - generates React Flow diagram HTML

### 6. Types Layer (`types/`)
- **Responsibility**: Shared interfaces and types
- **Dependencies**: None
- **Role**: Type definitions used across all layers
- **Key Types**: `ClassInfo`, `DiagramData`, `KrataiConfig`, `GitDiffInfo`

## Principles

1. **Separation of Concerns** - Each layer has a single, well-defined purpose
2. **Dependency Direction** - Dependencies flow downward (Commands → Services → Parsers → Types)
3. **Strategy Pattern** - Language parsers are interchangeable implementations of `IParserStrategy`
4. **Single Responsibility** - Path normalization happens in ONE place (`CodeParserService.parseWorkspace`)
5. **Testability** - Each module can be unit tested independently
6. **Scalability** - Add new languages by creating a parser class (minimal impact to existing code)

---

## 🌍 Multi-Language Support: Adding New Programming Languages

### Architecture Pattern: Strategy Pattern

Kratai uses the **Strategy Pattern** for language parsers, allowing new languages to be added with minimal changes to the core codebase.

```
IParserStrategy (interface)
    ↓
TypeScriptParser  →  ParserFactory  ← Registers all parsers
JavaScriptParser  →       ↑
PythonParser      →  (future)
PHPParser         →  (future)
```

### 📋 Checklist: Adding a New Language

#### Step 1: Create Parser Class
Create `src/services/parsers/{Language}Parser.ts`:

```typescript
import { IParserStrategy } from './IParserStrategy';
import { ClassInfo, ClassRelationship } from '../../types/diagram';

export class PythonParser implements IParserStrategy {
    supportedExtensions = ['.py'];
    
    parseFile(filePath: string): ClassInfo[] {
        // 1. Read and parse file using language-specific AST parser
        // 2. Extract classes, methods, properties
        // 3. ⚠️ MUST include line numbers for git diff highlighting
        return classes.map(cls => ({
            name: cls.name,
            filePath,  // ⚠️ Return absolute path (normalized by CodeParserService)
            properties: cls.properties.map(p => ({
                name: p.name,
                type: p.type,
                visibility: p.visibility,
                lineNumber: p.startLine,     // ⚠️ REQUIRED for git diff
                endLineNumber: p.endLine,    // ⚠️ REQUIRED for git diff
            })),
            methods: cls.methods.map(m => ({
                name: m.name,
                parameters: m.params,
                returnType: m.returnType,
                visibility: m.visibility,
                lineNumber: m.startLine,     // ⚠️ REQUIRED for git diff
                endLineNumber: m.endLine,    // ⚠️ REQUIRED for git diff
            })),
            extends: cls.baseClass,
            classType: 'class',
        }));
    }
    
    extractRelationships(
        classes: ClassInfo[], 
        allClassNames: Set<string>
    ): ClassRelationship[] {
        // Detect:
        // - Inheritance (extends)
        // - Implementation (implements)
        // - Composition/Dependency (uses)
        const relationships: ClassRelationship[] = [];
        // ... relationship extraction logic
        return relationships;
    }
}
```

#### Step 2: Register in Factory
Edit `src/services/parsers/ParserFactory.ts`:

```typescript
import { PythonParser } from './PythonParser';  // Add import

export class ParserFactory {
    constructor() {
        this.register(new TypeScriptParser());
        this.register(new JavaScriptParser());
        this.register(new PythonParser());      // ← Add one line
    }
    // ...
}
```

#### Step 3: Update Default Config
Edit `src/services/configService.ts`:

```typescript
static getDefaultConfig(): KrataiConfig {
    return {
        selectedFolders: [],
        selectedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.py'],  // ← Add extension
        // ...
    };
}
```

#### Step 4: Update Folder Pattern (if needed)
Edit `src/views/components/folderStructure.ts`:

```typescript
// Update regex to include new extension
const matchWithFolder = filePath.match(/src\/(.+)\/[^\/]+\.(tsx?|jsx?|py)$/);
const matchDirectInSrc = filePath.match(/src\/[^\/]+\.(tsx?|jsx?|py)$/);
```

**That's it!** ~10-15 lines of code to add a new language. 🎉

---

### ⚠️ Critical Best Practices

#### 1. **Always Include Line Numbers**
```typescript
// ❌ BAD: No line numbers = No git diff highlighting
methods.push({
    name: 'myMethod',
    returnType: 'void',
    // Missing: lineNumber, endLineNumber
});

// ✅ GOOD: Line numbers enable git diff highlighting
methods.push({
    name: 'myMethod',
    returnType: 'void',
    lineNumber: 42,        // Start line of method
    endLineNumber: 55,     // End line of method
});
```

**Why:** Git diff enrichment matches changed lines to specific methods/properties. Without line numbers, the entire class is marked as "modified" instead of highlighting individual members.

#### 2. **Return Absolute Paths from Parsers**
```typescript
// ✅ GOOD: Parser returns absolute path
parseFile(filePath: string): ClassInfo[] {
    return [{
        name: 'MyClass',
        filePath,  // Absolute: /Users/.../kratai/mvp/src/MyClass.ts
        // ...
    }];
}

// ❌ BAD: Don't normalize paths in the parser
parseFile(filePath: string): ClassInfo[] {
    const relativePath = path.relative(workspacePath, filePath);  // NO!
    // ...
}
```

**Why:** Path normalization happens in **ONE place**: `CodeParserService.parseWorkspace()`. Multiple normalization points cause path mismatches with git diff.

#### 3. **Single Responsibility: Path Normalization**
```typescript
// ✅ CORRECT FLOW:
// 1. Parser returns absolute path
TypeScriptParser.parseFile() → /Users/.../kratai/mvp/src/MyClass.ts

// 2. CodeParserService normalizes ONCE
CodeParserService.parseWorkspace() → test-fixtures/src/MyClass.ts

// 3. GitDiffEnricher converts to git-relative
GitDiffEnricher.enrichWithGitDiff() → mvp/test-fixtures/src/MyClass.ts

// 4. Git paths match!
```

**Why:** We learned this the hard way today. Normalizing paths in multiple places breaks git diff matching because each layer expects different path formats.

#### 4. **Consistent Data Structure**
All parsers must return `ClassInfo[]` with:
- ✅ `name` - Class/interface/module name
- ✅ `filePath` - Absolute path to source file
- ✅ `properties[]` - With `lineNumber`, `endLineNumber`
- ✅ `methods[]` - With `lineNumber`, `endLineNumber`
- ✅ `extends` - Base class name (if applicable)
- ✅ `implements` - Interface names (if applicable)
- ✅ `classType` - 'class' | 'interface' | 'module' | etc.

#### 5. **Git Commands Run from Git Root**
```typescript
// ✅ GOOD: All git commands use git root as cwd
const gitRoot = await GitDiffService.getGitRoot(workspacePath);
const { stdout } = await execAsync('git diff HEAD', { cwd: gitRoot });

// ❌ BAD: Using workspace as cwd with git-relative paths
const { stdout } = await execAsync('git diff HEAD', { cwd: workspacePath });
```

**Why:** Git diff returns paths relative to git root. Git commands must also run from git root, otherwise paths won't match.

---

### 🎯 Impact Analysis: Adding Python Support

| Component | Changes | Lines | Impact |
|---|---|---|---|
| `PythonParser.ts` | New file | ~200 | ✅ Isolated |
| `ParserFactory.ts` | Import + register | 2 | ✅ Minimal |
| `configService.ts` | Add `.py` extension | 1 | ✅ Minimal |
| `folderStructure.ts` | Update regex | 2 | ✅ Minimal |
| `codeParserService.ts` | No changes | 0 | ✅ None |
| `gitDiffEnricher.ts` | No changes | 0 | ✅ None |
| `diagramGeneratorService.ts` | No changes | 0 | ✅ None |
| **Total** | | **~205** | **Localized** |

---

### 🚫 Anti-Patterns to Avoid

#### ❌ Don't Normalize Paths in Multiple Places
```typescript
// BAD ARCHITECTURE (what we accidentally did today):
Parser.parseFile()           → Returns absolute path
generateClassDiagram.ts      → Normalizes to workspace-relative
GitDiffEnricher              → Tries to convert back to absolute
Result: Paths don't match git diff, highlighting breaks!
```

#### ❌ Don't Add Language-Specific Logic Outside Parsers
```typescript
// BAD: Language logic in shared code
if (file.endsWith('.py')) {
    // Python-specific parsing here
} else if (file.endsWith('.php')) {
    // PHP-specific parsing here
}

// GOOD: Use the factory
const parser = parserFactory.getParser(file);
if (parser) {
    const classes = parser.parseFile(file);
}
```

#### ❌ Don't Forget Constructor Properties
```typescript
// BAD: Missing constructor parameters as properties
class Dog {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
}
// Parser returns: properties = [] ❌

// GOOD: Extract constructor assignments
// Parser returns: properties = [{name: 'name'}, {name: 'age'}] ✅
```

---

### 🔮 Future: Plugin Architecture

For ultimate extensibility, language support could be implemented as VS Code extensions:

```
kratai-core              (base extension)
kratai-python-support    (language pack)
kratai-php-support       (language pack)
kratai-ruby-support      (language pack)
```

Each language pack would:
1. Implement `IParserStrategy`
2. Register with `ParserFactory` via extension API
3. Be installed/uninstalled independently

---

## Adding New Features

### New Command
1. Create service in `services/` (if needed)
2. Create view in `views/` (if needed)
3. Create command handler in `commands/`
4. Register in `extension.ts`

### New Language Support
1. Create parser in `services/parsers/{Language}Parser.ts`
2. Register in `ParserFactory.ts` (1 line)
3. Add extension to default config (1 line)
4. Update folder pattern regex (2 lines)

### Example Flow: Class Diagram Generation
```
User triggers "Generate Class Diagram"
  → extension.ts (routes to command)
    → generateClassDiagram.ts (orchestrates)
      → codeParserService.ts (finds files, normalizes paths)
        → parserFactory.getParser(file)
          → TypeScriptParser.parseFile() OR JavaScriptParser.parseFile()
      → gitDiffEnricher.ts (enriches with git changes)
      → diagramGeneratorService.ts (generates React Flow nodes/edges)
      → classDiagramView.ts (generates HTML)
    → displays webview with interactive diagram
```

## Benefits

- **Maintainable**: Easy to locate and modify code, single-responsibility modules
- **Scalable**: Add features and languages without touching existing code
- **Multi-Language**: Strategy Pattern enables parsing any programming language with ~10 lines of integration code
- **Testable**: Mock services/parsers/views in command tests, parsers are independently testable
- **Readable**: Clear structure, predictable file locations, consistent interfaces
- **Git Integration**: Automatic change highlighting for all supported languages (if parsers include line numbers)

---

## Key Architectural Decisions

### 1. Strategy Pattern for Parsers
**Decision**: Use Strategy Pattern instead of if/else chains or switch statements.

**Rationale**: Adding a new language requires creating a parser class and registering it, with zero changes to existing parsers or core logic.

**Trade-off**: Slightly more complex initially, but pays off when adding languages 2+.

### 2. Single Path Normalization Point
**Decision**: Normalize all file paths in `CodeParserService.parseWorkspace()` immediately after parsing.

**Rationale**: Parsers from different languages may handle paths differently. Centralizing normalization ensures consistency and prevents path-matching bugs (e.g., git diff not working).

**Trade-off**: None. This is a clear win for maintainability.

### 3. Line Numbers Required
**Decision**: All parsers MUST return line numbers for properties and methods.

**Rationale**: Enables member-level git diff highlighting. Without line numbers, only file-level changes can be detected.

**Trade-off**: Parser implementation is slightly more complex, but critical for user experience.
