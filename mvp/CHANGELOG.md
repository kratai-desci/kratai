# Change Log

All notable changes to the Kratai extension will be documented in this file.

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
