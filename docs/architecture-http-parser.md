# HTTPParser Architecture

## Overview

HTTPParser is a **second-pass parser** that runs after language-specific parsers to detect HTTP patterns across all languages.

## Architecture Decision

### Why Second-Pass?

Unlike language parsers that focus on syntax:
- HTTPParser detects **semantic patterns** (HTTP calls, routes)
- Works **cross-language** (TypeScript, Python, PHP)
- Requires **full workspace context** to match calls to routes
- Creates **virtual nodes** (route endpoints)

### Integration Flow

```
1. Language Parsers (First Pass)
   ├── TypeScriptParser → classes, functions
   ├── PythonParser → classes, functions
   └── PHPParser → classes, functions
   
2. HTTPParser (Second Pass)
   ├── Scan all files for HTTP patterns
   ├── Create route nodes (virtual ClassInfo)
   └── Link calls to routes

3. Return DiagramData
   ├── Classes (from language parsers)
   ├── Routes (from HTTPParser)
   └── Relationships (from all parsers)
```

## Key Components

### 1. HTTPParser Class

**Location:** `src/services/parsing/languages/HTTPParser.ts`

**Implements:** `AbstractParserStrategy`

**Special Properties:**
- `supportedExtensions: ['*']` - Handles all file types
- Second-pass execution via `ParserFactory.getHttpParser()`

**Methods:**
- `parseFile()` - Extract route definitions from decorators, file paths
- `extractRelationships()` - Detect HTTP calls and link to routes

### 2. Route Nodes

HTTP endpoints are represented as `ClassInfo` with:
- `classType: 'route'`
- `routeMeta: { path, method, definedIn }`
- Virtual file path: `route://path`

**Example:**
```typescript
{
  name: 'GET /api/users',
  filePath: 'route:///api/users',
  classType: 'route',
  routeMeta: {
    path: '/api/users',
    method: 'GET',
    definedIn: 'src/controllers/UserController.ts'
  }
}
```

### 3. New Relationship Types

Added to `ClassRelationship`:
- `http-call`: Client → Route endpoint
- `routes-to`: Route endpoint → Handler

**Example Flow:**
```
UserList --[http-call]--> GET /api/users --[routes-to]--> UserController
```

## Type Changes

### ClassInfo
```typescript
classType?: 'class' | 'interface' | 'module' | 'route';  // Added 'route'

routeMeta?: {
  path: string;        // '/api/users/:id'
  method: string;      // 'GET', 'POST', '*'
  definedIn?: string;  // Source file path
};
```

### ClassRelationship
```typescript
type: 'http-call' | 'routes-to' | ...;  // Added HTTP types

metadata?: {
  [key: string]: any;  // Added for method, url, library
};
```

## Detected Patterns

### Route Definitions
- **Decorators:** `@Get('/users')`, `@Post('/users')`
- **File-based:** `app/api/users/route.ts` → `/api/users`
- **Annotations:** (Future) Django `path()`, Laravel `Route::get()`

### HTTP Calls
- **fetch:** `fetch('/api/users')`
- **axios:** `axios.get('/api/users')`
- **Others:** (Future) requests, Guzzle, http

## Benefits

1. **Consistent Architecture** - Follows AbstractParserStrategy pattern
2. **Cross-Language** - Works with all language parsers
3. **Visual Routes** - HTTP endpoints visible in diagrams
4. **Clear Flow** - Client → Route → Handler visualization
5. **Extensible** - Easy to add new HTTP patterns

## Future Enhancements

1. More HTTP libraries (requests, Guzzle, http)
2. Framework-specific route detection (Laravel, Django)
3. Dynamic route matching with parameters
4. Middleware detection
5. Request/response type inference

## Testing

HTTP parser will have dedicated tests (TDD to be implemented):
- Route detection tests
- HTTP call detection tests
- Relationship linking tests
- Cross-language tests

## Migration Note

The new HTTPParser coexists with the legacy `HttpCallDetector`. Once HTTPParser is fully tested and validated, `HttpCallDetector` will be deprecated.
