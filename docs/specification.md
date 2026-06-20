# Kratai Functional Requirements

## Core Features

### FR-001: Class Diagram Generation
Generate interactive class diagrams from source code files in a workspace.

### FR-002: Multi-Language Support
Parse and visualize code from TypeScript, JavaScript, Python, and PHP files.

### FR-003: Folder-Based Organization
Group classes by their folder structure in the diagram.

### FR-004: Relationship Detection
Automatically detect and visualize inheritance, implementation, composition, and usage relationships between classes.

---

## Parsing Requirements

### FR-101: Extract Classes
Extract class/interface/module definitions from source files.

### FR-102: Extract Properties
Extract class properties/fields with types and visibility.

### FR-103: Extract Methods
Extract class methods with parameters, return types, and visibility.

### FR-104: Line Number Tracking
Store line numbers for all extracted members (for navigation and git diff).

### FR-105: Inheritance Detection
Detect when classes extend other classes.

### FR-106: Interface Implementation
Detect when classes implement interfaces.

### FR-107: Composition Detection
Detect when classes use other classes as properties.

### FR-108: Dependency Detection
Detect when classes use other classes in methods.

---

## Framework-Specific Parsing

### TypeScript/JavaScript Frameworks

#### FR-201: React Components
Extract React class components and functional components with props and hooks.

#### FR-202: React Props/State
Detect component props (PropTypes/TypeScript interfaces) and state variables.

#### FR-203: React Hooks
Detect custom hooks and hook dependencies (useState, useEffect, etc.).

#### FR-204: Next.js App Router
Detect Next.js App Router route handlers (route.ts) and Server Components.

#### FR-205: Next.js Pages Router
Detect Next.js Pages Router pages and API routes.

#### FR-206: NestJS Modules
Parse NestJS decorators (@Module, @Injectable, @Controller) and dependency injection.

#### FR-207: Express.js Routes
Detect Express.js route definitions (app.get, app.post, router.use).

#### FR-208: Express.js Middleware
Detect Express middleware functions and their usage.

#### FR-209: Vue.js Components
Extract Vue 3 Composition API components and Options API components.

#### FR-210: Vue.js Props/Emits
Detect Vue component props, emits, and computed properties.

#### FR-211: Angular Components
Parse Angular @Component decorators and component metadata.

#### FR-212: Angular Services
Detect Angular @Injectable services and dependency injection.

### Python Frameworks

#### FR-301: Django Model Fields
Extract Django model fields (CharField, ForeignKey, etc.) as properties.

#### FR-302: Django Relationships
Detect Django ForeignKey/ManyToMany/OneToOne as relationships.

#### FR-303: Django Views
Parse Django class-based views (ListView, DetailView, etc.) and detect model usage.

#### FR-304: Django REST Framework
Detect DRF serializers, viewsets, and API routes.

#### FR-305: Flask Routes
Detect Flask route decorators (@app.route) and extract route handlers.

#### FR-306: Flask Blueprints
Detect Flask Blueprint definitions and routes.

#### FR-307: FastAPI Endpoints
Detect FastAPI route decorators (@app.get, @app.post) and path operations.

#### FR-308: FastAPI Models
Parse Pydantic models with typed fields and validators.

### PHP Frameworks

#### FR-401: Laravel Models
Parse Laravel Eloquent models and detect relationships.

#### FR-402: Laravel Relationships
Detect Laravel relationship methods (belongsTo, hasMany, belongsToMany, etc.).

#### FR-403: Laravel Controllers
Parse Laravel controllers and detect model usage.

#### FR-404: Laravel Routes
Detect Laravel route definitions (Route::get, Route::post, etc.).

#### FR-405: Symfony Entities
Parse Symfony Doctrine entities and annotations.

#### FR-406: Symfony Controllers
Detect Symfony controller actions and route attributes.

### Ruby Frameworks

#### FR-501: Ruby on Rails Models
Parse ActiveRecord models and associations.

#### FR-502: Ruby on Rails Controllers
Detect Rails controller actions and before_action filters.

#### FR-503: Ruby on Rails Routes
Parse routes.rb and extract route definitions.

---

## User Interface

### FR-600: Interactive Diagram
Display class diagram with SVG-based rendering for relationships and HTML for class boxes, with pan and zoom capabilities.

### FR-601: Click-to-Highlight
Click a class to highlight it and its related classes.

### FR-602: Click-to-Jump
Click a method/property to open the file and highlight the code.

### FR-603: Hover-to-Open
Show three-dot button on hover to open class file.

### FR-604: Focus Mode
Press ESC to clear highlights and return to full view.

### FR-605: Zoom Controls
Zoom in/out and reset zoom on the diagram.

---

## Git Integration

### FR-700: Git Diff Detection
Detect uncommitted changes in the workspace.

### FR-701: Change Highlighting
Highlight changed members with color coding:
- Green = Added files/methods/properties
- Yellow = Modified files/methods/properties
- Red = Deleted files/methods/properties

### FR-702: File-Level Changes
Show which files have uncommitted changes.

### FR-703: Member-Level Changes
Show which specific methods/properties changed.

---

## Configuration

### FR-800: Folder Selection
Allow users to select which folders to scan.

### FR-801: Extension Selection
Allow users to select which file extensions to include.

### FR-802: Class Type Filters
Allow users to show/hide classes, interfaces, modules.

### FR-803: Relationship Filters
Allow users to show/hide different relationship types.

### FR-804: Git Diff Toggle
Allow users to enable/disable git diff highlighting.

### FR-805: Persistent Configuration
Save configuration to `.vscode/kratai.json`.

---

## Performance

### FR-900: Folder Exclusion
Automatically exclude node_modules, venv, vendor, etc.

### FR-901: Lazy Loading
Only parse files in selected folders.

### FR-902: Incremental Parsing
Only re-parse files that changed (future).

### FR-903: Performance Target
Generate diagram for 100 files in < 5 seconds.

---

## Navigation

### FR-1000: Open Source File
Open the source file for a class in the editor.

### FR-1001: Jump to Definition
Navigate to specific method/property definition.

### FR-1002: Column Layout
Always open files in Column Two (beside diagram).

### FR-1003: Highlight Selection
Select and highlight the entire method/property code.

### FR-1004: Center Viewport
Center the highlighted code in the editor viewport.

---

## HTTP Call Detection (Optional)

### FR-1100: Detect API Calls
Detect fetch/axios/useSWR calls in frontend code.

### FR-1101: Match Routes
Match API calls to route handler files (e.g., Next.js).

### FR-1102: Visualize API Flow
Show relationships between frontend components and API routes.

---

## Sidebar Integration

### FR-1200: Activity Bar Icon
Show Kratai icon in VS Code Activity Bar.

### FR-1201: Quick Actions
Provide quick access to generate diagram, settings, git changes.

### FR-1202: Community Link
Link to GitHub Discussions for feedback.

---

## Quality Requirements

### FR-1300: Error Handling
Gracefully handle parsing errors without crashing.

### FR-1301: User Feedback
Show progress indicators during diagram generation.

### FR-1302: Empty State Handling
Show helpful message when no classes found.

### FR-1303: Large Codebase Handling
Handle projects with 1000+ classes without freezing.

---

## Testing Requirements

### FR-1400: Unit Test Coverage
All parsers must have unit tests.

### FR-1401: Integration Tests
Test full diagram generation on real projects.

### FR-1402: Fixture Tests
Test against real-world framework applications.

### FR-1403: Relationship Tests
Verify all relationship types are detected correctly.

### FR-1404: Line Number Tests
Verify line numbers are accurate for navigation.

---

## Current Implementation Status

| FR ID | Status | Notes |
|-------|--------|-------|
| FR-001 to FR-004 | ✅ Implemented | Core features working |
| FR-101 to FR-108 | ✅ TypeScript/JS<br>⚠️ Python/PHP | Framework-agnostic parsing works for TS/JS |
| FR-201 to FR-212 | ✅ Next.js/NestJS<br>⚠️ React/Vue/Angular<br>❌ Express | TypeScript frameworks partially working |
| FR-301 to FR-308 | ❌ Not Implemented | Python framework-specific parsing missing |
| FR-401 to FR-406 | ⚠️ Basic Laravel<br>❌ Symfony | PHP framework support minimal |
| FR-501 to FR-503 | ❌ Not Implemented | Ruby not supported |
| FR-600 to FR-605 | ✅ Implemented | UI/UX features complete |
| FR-700 to FR-703 | ✅ Implemented | Git integration working (uncommitted only) |
| FR-800 to FR-805 | ✅ Implemented | Configuration working |
| FR-900 to FR-903 | ⚠️ Partial | Exclusions added, performance varies |
| FR-1000 to FR-1004 | ✅ Implemented | Navigation complete |
| FR-1100 to FR-1102 | ⚠️ Experimental | Basic detection, needs improvement |
| FR-1200 to FR-1202 | ✅ Implemented | Sidebar working |
| FR-1300 to FR-1303 | ⚠️ Partial | Some error handling, needs improvement |
| FR-1400 to FR-1404 | ❌ Not Implemented | No test suite exists |

---

## Priority for Refactor

### Phase 1: Testing Infrastructure (Week 1-2)
- FR-1400: Create unit test framework
- FR-1401: Create integration test suite
- FR-1402: Build real-world test fixtures (React, Django, Flask, Laravel, Express)

### Phase 2: TypeScript/JavaScript Frameworks (Week 3-4)
- FR-201: React component and props extraction
- FR-202: React hooks detection
- FR-207: Express.js route detection
- FR-209: Vue.js component parsing
- FR-211: Angular component parsing

### Phase 3: Python Framework Support (Week 5-6)
- FR-301: Django model field extraction
- FR-302: Django relationship detection
- FR-303: Django view parsing
- FR-305: Flask route detection
- FR-307: FastAPI endpoint detection

### Phase 4: PHP Framework Support (Week 7-8)
- FR-401: Laravel model parsing improvements
- FR-402: Laravel relationship detection
- FR-403: Laravel controller parsing
- FR-405: Symfony entity parsing

### Phase 5: Quality & Performance (Week 9-10)
- FR-1300: Comprehensive error handling
- FR-903: Performance optimization
- FR-1303: Large codebase support

---

## Success Criteria

**Before marking any FR as "Complete":**
1. ✅ Implementation exists
2. ✅ Unit tests pass (100%)
3. ✅ Integration tests pass
4. ✅ Tested on real-world projects
5. ✅ User validation (beta testers)
6. ✅ Documentation updated
