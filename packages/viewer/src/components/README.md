# Class Diagram View Components

This directory contains modular components for generating hierarchical class diagrams in VS Code.

## Architecture

The class diagram generation is split into focused, testable components:

### 📁 `folderStructure.ts`
**Responsibility:** Build hierarchical folder tree from flat file paths
- `FolderStructureBuilder.build()` - Parses file paths into nested structure
- `FolderStructureBuilder.logStructure()` - Debug logging
- `FolderStructureBuilder.countClasses()` - Count classes recursively
- `FolderStructureBuilder.countFolders()` - Count folders recursively

### 📐 `layoutCalculator.ts`
**Responsibility:** Calculate positions for all visual elements
- `HierarchicalLayoutCalculator.calculate()` - Recursively layout folders & classes
- Stores class positions and folder sizes
- Calculates canvas dimensions
- Uses configuration object for spacing/sizing

### 🎨 `classBoxRenderer.ts`
**Responsibility:** Render individual class/module boxes as HTML
- Renders class header (name, stereotype)
- Renders properties compartment
- Renders methods compartment
- Handles modules vs classes vs interfaces
- Applies UML visibility symbols (+, -, #)

### 📦 `folderBoxRenderer.ts`
**Responsibility:** Render folder background boxes
- Recursive rendering of nested folders
- Progressive opacity for depth indication
- Folder icons based on name patterns
- Class count badges

### 🔗 `relationshipRenderer.ts`
**Responsibility:** Render SVG lines for relationships
- Renders inheritance (extends)
- Renders implementation (implements)
- Renders usage (uses)
- Curved paths for visibility
- SVG marker definitions (arrowheads)

## Usage

```typescript
import { ClassDiagramView } from './classDiagramView';

const html = ClassDiagramView.generate(nodes, edges, workspaceName);
```

## File Sizes (Before/After)

**Before:** 1 file × 554 lines = 554 total lines
**After:** 6 files × ~100-150 lines each

## Benefits

✅ **Testable** - Each component can be unit tested independently  
✅ **Maintainable** - Clear separation of concerns  
✅ **Reusable** - Components can be reused in different contexts  
✅ **Debuggable** - Easier to isolate issues  
✅ **Extensible** - Easy to add new features without touching everything
