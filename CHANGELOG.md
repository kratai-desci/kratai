# Change Log

All notable changes to the Kratai extension will be documented in this file.

## [1.6.1] - 2026-06-19

### Documentation
- Updated architecture.md to clarify git diff shows uncommitted changes only
- Verified all documentation accurate for publication

## [1.6.0] - 2026-06-18

### Added
- **Click-to-Jump Navigation** — Click any method or property to instantly open file and highlight the code
- Direct navigation from diagram to source with precise line-level highlighting
- Blue selection highlight spans entire method/property definition for easy spotting
- Automatic viewport centering when jumping to code

### Changed
- **MAJOR UX IMPROVEMENT**: Replaced sequence diagram integration with instant click-to-jump
- **Git diff now only shows uncommitted changes** (not committed changes from previous commits)
- Removed method call pre-computation (massive performance boost on large codebases)
- All methods and properties now clickable with consistent Column Two layout
- Diagram generation now 5-30 seconds faster (no method analysis overhead)

### Fixed
- **Event propagation race condition** — Clicking methods no longer triggers class focus mode
- Methods now properly ignore parent class click handlers
- Fixed line number detection for exported functions in module files (route.ts, etc.)
- Array type annotations now detected: `const books: Book[] = [...]`

### Technical
- Added `event.stopPropagation()` to prevent click bubbling from methods to class boxes
- Enhanced TypeScript parser to include line numbers for module-level exports
- Sequence diagram logic preserved (methodTracerService, sequenceDiagramView) for future use
- Simplified CSS: removed sequence-specific styles, kept member click-to-jump styles
- Updated architecture.md with "Click-to-Jump Navigation" section

### Performance
- Eliminated expensive method call analysis during diagram generation
- No more "Analyzing method calls..." progress step
- Instant member navigation using pre-computed line numbers from parsing phase
- Git diff now only compares uncommitted changes (faster, more relevant)

## [1.5.0] - 2026-06-16

### Added
- **Import Detection** — Routes now show dependencies on imported lib files (Database, auth modules)
- **Smart Clickable Methods** — Only methods with internal calls are clickable (light blue background)
- Pre-computed method call analysis prevents false positives and empty sequence diagrams
- Sequence diagram panel reuse — clicking multiple methods updates same panel instead of creating new columns

### Fixed
- **CRITICAL**: HTTP call URL pattern matching — routes now correctly match API endpoints
- Fixed file path resolution in `filePathToUrlPattern()` for Next.js App Router
- Sequence diagram now reuses existing panel instead of spawning multiple columns
- False positive clickable methods (methods with no internal calls no longer appear clickable)

### Changed
- Method analysis runs during diagram generation with progress indicator
- Clickable methods have light blue background with darker hover effect
- Non-clickable methods slightly dimmed (85% opacity)
- Console logging shows method analysis statistics

### Technical
- Added `hasInternalCalls` flag to `MethodInfo` interface
- TypeScript parser now detects import statements (named and default imports)
- Import-based relationships created for lib dependencies
- Sequence panel reference tracked and reused via `onDidDispose` handler
- Shallow method tracing (depth=3) during pre-computation for performance

## [1.4.0] - 2026-06-15

### Added
- **Click-to-Highlight** — Click any class to highlight it and its dependencies with monochromatic focus
- **Hover-to-Open Files** — Three-dot (⋮) button appears on hover to instantly open source files in editor
- **Monochromatic Focus Mode** — Clean black/grey highlighting maintains professional diagram aesthetics
- **Keyboard Shortcut** — Press ESC to clear focus and return to full diagram view
- **Simplified Configuration** — Root folder now selected by default for predictable, user-friendly setup

### Changed
- Configuration panel now shows "Root folder selected by default" instead of auto-detecting common folders
- Focus highlighting uses monochromatic scheme (black/grey) instead of colors
- Relationship lines turn bold black when highlighted (from grey)

### Technical
- Click handlers prevent focus trigger when clicking open-file button or method items
- Focus state managed via CSS classes: `.focused`, `.related`, `.dimmed`
- Smooth 0.3s transitions for all focus state changes
- Badge notification for ESC shortcut hint

## [1.3.0] - 2026-06-14

### Added
- **HTTP Call Detection** - Automatically detects API calls from UI to routes (fetch, axios, useSWR)
- Shows "calls" relationships from pages/components to API route handlers
- Supports Next.js App Router pattern matching (including dynamic routes like /api/users/[id])
- New purple dotted line style for HTTP call relationships
- Configurable via `detectHttpCalls` setting (enabled by default)

### Technical
- New `HttpCallDetector` service for semantic HTTP call analysis
- Separates concerns: parsers handle syntax, HttpCallDetector handles API call semantics
- Pattern matching for fetch(), axios.get/post(), useSWR(), useQuery()
- Smart route matching: /api/users/123 matches /api/users/[id]

## [1.2.1] - 2026-06-13

### Added
- **Indeterminate checkbox state** - Parent folders now show "-" when some (but not all) subfolders are selected
- **Cascading folder selection** - Selecting a parent folder automatically selects all subfolders
- Automatic parent state updates when child folder selections change

### Improved
- Configuration panel folder tree now has smarter checkbox behavior
- Better visual feedback for partial folder selections

## [1.2.0] - 2026-06-13

### Added
- **Module-level instantiation detection** - Now detects `const x = new ClassName()` in route.ts and other module-level files
- Relationships now properly show connections from Next.js App Router routes to controllers

### Fixed
- **CRITICAL**: Fixed file path resolution in module-level instantiation scanner - was using workspace-relative paths instead of absolute paths
- Next.js route handlers (route.ts) now correctly show "uses" relationships to controllers
- Module files without classes now properly detect their dependencies

### Technical
- Enhanced TypeScript parser to scan module-level code for class instantiations
- Updated parser interface to accept workspacePath for proper file resolution

## [1.1.0] - 2026-06-12

### Fixed
- **CRITICAL**: Fixed sidebar not loading - moved TypeScript from devDependencies to dependencies
- Fixed tree data provider registration to properly add to extension context subscriptions
- Changed activation event from "*" to "onStartupFinished" for better performance

### Technical
- Extension now properly bundles TypeScript compiler (required for parsing TypeScript/JavaScript files)
- Improved extension activation logging for debugging

## [1.0.9] - 2026-06-12

### Fixed
- **CRITICAL FIX**: Moved `typescript` from devDependencies to dependencies
- Extension was crashing with "Cannot find module 'typescript'" error at runtime
- TypeScript module now properly bundled with extension package

## [1.0.8] - 2026-06-12

### Fixed
- Changed activation event to "*" (immediate activation) for debugging
- This forces extension to load immediately on VS Code startup to diagnose sidebar issues

## [1.0.7] - 2026-06-12

### Fixed
- Changed activation event to `onStartupFinished` to ensure extension loads immediately on VS Code startup
- Added debug logging to track extension activation and tree provider registration
- Improved error diagnostics for sidebar loading issues

## [1.0.6] - 2026-06-12

### Fixed
- **CRITICAL**: Added missing activation event `onView:kratai-actions` - extension now activates when sidebar is opened
- This fixes the "no data provider registered" error that prevented the sidebar from loading

## [1.0.5] - 2026-06-12

### Fixed
- Fixed "no data provider registered" error in sidebar by properly subscribing tree data provider to extension context
- Sidebar actions panel now displays correctly on extension activation

## [1.0.4] - 2026-06-11

### Changed
- Updated GitHub organization from Rabbit-CollectiveScience to kratai-desci
- Updated all repository URLs, image URLs, and community links

## [1.0.3] - 2026-06-11

### Changed
- Updated repository URLs from kratai-core to kratai
- Moved project structure from mvp/ subfolder to repository root
- Updated all image URLs to reflect new repository structure

## [1.0.2] - 2026-06-11

### Fixed
- README images now display correctly on VS Code Marketplace using absolute GitHub URLs
- Demo GIF and screenshots now visible on extension marketplace page

### Changed
- Updated extension icon to white version for better visibility on marketplace dark theme

## [1.0.1] - 2026-06-10

### Added
- Entry/exit arrows in sequence diagrams showing method invocation and return points
- JSDoc type annotation parsing in JavaScript parser for accurate type detection
- Support for complex Python type hints: `Optional[T]`, `List[T]`, `Dict[K,V]`, `Union[A,B]`, `Tuple[...]`

### Fixed
- JavaScript classes now show relationship arrows based on JSDoc `@type` annotations
- Python methods with complex return types now properly detected (e.g., `-> Optional[Product]`)
- JavaScript constructor properties now extract types from JSDoc comments
- Type inference from TypeScript type checker for JavaScript files with `checkJs: true`

### Technical
- JavaScript parser creates TypeScript program with `checkJs` enabled for JSDoc analysis
- Python parser regex updated to match complex type expressions in return type hints
- Added debug logging for JavaScript property type extraction

## [1.0.0] - 2026-06-08

### Added
- Interactive class diagram with folder-based layout
- Sequence diagram generation by clicking any method
- Git diff highlighting — added (green), modified (yellow), deleted (red)
- Static vs instance method call tracking in sequence diagrams
- Configurable folder filters and class type filters
- Dark header theme with project logo
