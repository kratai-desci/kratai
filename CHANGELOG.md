# Change Log

All notable changes to the Kratai extension will be documented in this file.

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
