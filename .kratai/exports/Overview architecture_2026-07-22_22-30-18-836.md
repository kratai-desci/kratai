# Overview architecture

Generated: 7/23/2026, 5:30:18 AM
Total: 97 classes, 150 relationships

---

## Project Structure

```
├── route:
│   └── 
│       └── 
│           ├── path
│           └── users
└── src
    ├── commands
    │   ├── generateClassDiagram.ts
    │   ├── generateDiagramFromView.ts
    │   ├── index.ts
    │   ├── showConfigPanel.ts
    │   └── showGitChanges.ts
    ├── services
    │   ├── diagram
    │   │   ├── diagramGeneratorService.ts
    │   │   ├── folderStructure.ts
    │   │   ├── index.ts
    │   │   └── layoutCalculator.ts
    │   ├── enrichment
    │   │   ├── AbstractEnricher.ts
    │   │   ├── EnricherRegistry.ts
    │   │   ├── frameworks
    │   │   │   ├── DjangoEnricher.ts
    │   │   │   ├── NextJSEnricher.ts
    │   │   │   └── SpringBootEnricher.ts
    │   │   └── index.ts
    │   ├── export
    │   │   └── MarkdownExporter.ts
    │   ├── git
    │   │   ├── contracts.ts
    │   │   ├── gitDiffEnricher.ts
    │   │   ├── gitOperations.ts
    │   │   └── index.ts
    │   ├── parsing
    │   │   ├── codeParserService.ts
    │   │   ├── frameworks
    │   │   │   ├── FrameworkDetector.ts
    │   │   │   ├── FrameworkEnricherFactory.ts
    │   │   │   ├── IFrameworkEnricher.ts
    │   │   │   └── index.ts
    │   │   ├── httpCallDetector.ts
    │   │   ├── index.ts
    │   │   ├── languages
    │   │   │   ├── AbstractParserStrategy.ts
    │   │   │   ├── HTMLParser.ts
    │   │   │   ├── HTTPParser.ts
    │   │   │   ├── JavaParser.ts
    │   │   │   ├── JavaScriptParser.ts
    │   │   │   ├── PHPParser.ts
    │   │   │   ├── ParserFactory.ts
    │   │   │   ├── PythonParser.ts
    │   │   │   └── TypeScriptParser.ts
    │   │   └── workspaceScanner.ts
    │   ├── telemetry
    │   │   ├── index.ts
    │   │   └── telemetryService.ts
    │   ├── util
    │   │   ├── configService.ts
    │   │   ├── index.ts
    │   │   └── umlMapper.ts
    │   └── view
    │       ├── ViewManager.ts
    │       └── index.ts
    ├── types
    │   ├── config
    │   │   ├── KrataiConfig.ts
    │   │   └── index.ts
    │   ├── domain
    │   │   ├── ClassInfo.ts
    │   │   ├── ClassRelationship.ts
    │   │   ├── DiagramData.ts
    │   │   ├── MethodInfo.ts
    │   │   ├── ParameterInfo.ts
    │   │   ├── PropertyInfo.ts
    │   │   └── index.ts
    │   └── view
    │       ├── ConfigFolderNode.ts
    │       ├── DiagramView.ts
    │       ├── ExtensionInfo.ts
    │       ├── ReactFlowEdge.ts
    │       ├── ReactFlowNode.ts
    │       └── index.ts
    └── views
        ├── classDiagramView.ts
        ├── components
        │   ├── classBoxRenderer.ts
        │   ├── folderBoxRenderer.ts
        │   └── relationshipRenderer.ts
        ├── gitChangesView.ts
        └── krataiTreeProvider.ts
```
---

## Classes (97)

generateClassDiagram (module)
Methods:
- + generateClassDiagram(context: vscode.ExtensionContext): Promise<void> [async]
Uses: generateClassDiagramDirect (async-calls, calls)
---

generateClassDiagramDirect (module)
Methods:
- + generateClassDiagramDirect(context: vscode.ExtensionContext): Promise<void> [async]
Used By: generateClassDiagram (async-calls, calls)
---

generateDiagramFromView (module)
Methods:
- + generateDiagramFromView(context: vscode.ExtensionContext, viewId: string): Promise<void> [async]
---

index (module)
---

ConfigPanelOptions (interface)
Properties:
- + mode: 'create' | 'edit'
- + viewName: string
- + viewId: string
Uses: buildTreeRecursive (calls), buildFolderTree (calls), detectAvailableTypes (async-calls, calls), countRelationshipsByType (async-calls, calls), generateConfigHTML (calls), renderFolderTree (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), hasSelectedDescendants (calls)
---

detectAvailableTypes (module)
Methods:
- + detectAvailableTypes(workspacePath: string): Promise<string[]> [async]
Uses: buildTreeRecursive (calls), buildFolderTree (calls), countRelationshipsByType (async-calls, calls), generateConfigHTML (calls), renderFolderTree (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), hasSelectedDescendants (calls)
Used By: ConfigPanelOptions (async-calls, calls), countRelationshipsByType (async-calls, calls), getTypeLabel (async-calls, calls), getRelTypeLabel (async-calls, calls), getRelTypeDescription (async-calls, calls), buildFolderTree (async-calls, calls), buildTreeRecursive (async-calls, calls), showConfigPanel (async-calls, calls), generateConfigHTML (async-calls, calls), renderFolderTree (async-calls, calls), hasSelectedDescendants (async-calls, calls)
---

countRelationshipsByType (module)
Methods:
- + countRelationshipsByType(workspacePath: string, config: KrataiConfig): Promise<Record<string, number>> [async]
Uses: buildTreeRecursive (calls), buildFolderTree (calls), detectAvailableTypes (async-calls, calls), generateConfigHTML (calls), renderFolderTree (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), hasSelectedDescendants (calls)
Used By: ConfigPanelOptions (async-calls, calls), detectAvailableTypes (async-calls, calls), getTypeLabel (async-calls, calls), getRelTypeLabel (async-calls, calls), getRelTypeDescription (async-calls, calls), buildFolderTree (async-calls, calls), buildTreeRecursive (async-calls, calls), showConfigPanel (async-calls, calls), generateConfigHTML (async-calls, calls), renderFolderTree (async-calls, calls), hasSelectedDescendants (async-calls, calls)
---

getTypeLabel (module)
Methods:
- + getTypeLabel(type: string): string
Uses: buildTreeRecursive (calls), buildFolderTree (calls), detectAvailableTypes (async-calls, calls), countRelationshipsByType (async-calls, calls), generateConfigHTML (calls), renderFolderTree (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), hasSelectedDescendants (calls)
Used By: ConfigPanelOptions (calls), detectAvailableTypes (calls), countRelationshipsByType (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), buildFolderTree (calls), buildTreeRecursive (calls), showConfigPanel (calls), generateConfigHTML (calls), renderFolderTree (calls), hasSelectedDescendants (calls)
---

getRelTypeLabel (module)
Methods:
- + getRelTypeLabel(type: string): string
Uses: buildTreeRecursive (calls), buildFolderTree (calls), detectAvailableTypes (async-calls, calls), countRelationshipsByType (async-calls, calls), generateConfigHTML (calls), renderFolderTree (calls), getTypeLabel (calls), getRelTypeDescription (calls), hasSelectedDescendants (calls)
Used By: ConfigPanelOptions (calls), detectAvailableTypes (calls), countRelationshipsByType (calls), getTypeLabel (calls), getRelTypeDescription (calls), buildFolderTree (calls), buildTreeRecursive (calls), showConfigPanel (calls), generateConfigHTML (calls), renderFolderTree (calls), hasSelectedDescendants (calls)
---

getRelTypeDescription (module)
Methods:
- + getRelTypeDescription(type: string): string
Uses: buildTreeRecursive (calls), buildFolderTree (calls), detectAvailableTypes (async-calls, calls), countRelationshipsByType (async-calls, calls), generateConfigHTML (calls), renderFolderTree (calls), getTypeLabel (calls), getRelTypeLabel (calls), hasSelectedDescendants (calls)
Used By: ConfigPanelOptions (calls), detectAvailableTypes (calls), countRelationshipsByType (calls), getTypeLabel (calls), getRelTypeLabel (calls), buildFolderTree (calls), buildTreeRecursive (calls), showConfigPanel (calls), generateConfigHTML (calls), renderFolderTree (calls), hasSelectedDescendants (calls)
---

buildFolderTree (module)
Methods:
- + buildFolderTree(workspacePath: string, selectedFolders: string[]): import('../types/view').ConfigFolderNode
Uses: buildTreeRecursive (calls), detectAvailableTypes (async-calls, calls), countRelationshipsByType (async-calls, calls), generateConfigHTML (calls), renderFolderTree (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), hasSelectedDescendants (calls)
Used By: ConfigPanelOptions (calls), detectAvailableTypes (calls), countRelationshipsByType (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), buildTreeRecursive (calls), showConfigPanel (calls), generateConfigHTML (calls), renderFolderTree (calls), hasSelectedDescendants (calls)
---

buildTreeRecursive (module)
Methods:
- + buildTreeRecursive(relativePath: string, node: import('../types/view').ConfigFolderNode): void
Uses: buildFolderTree (calls), detectAvailableTypes (async-calls, calls), countRelationshipsByType (async-calls, calls), generateConfigHTML (calls), renderFolderTree (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), hasSelectedDescendants (calls)
Used By: ConfigPanelOptions (calls), detectAvailableTypes (calls), countRelationshipsByType (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), buildFolderTree (calls), showConfigPanel (calls), generateConfigHTML (calls), renderFolderTree (calls), hasSelectedDescendants (calls)
---

showConfigPanel (module)
Methods:
- + showConfigPanel(context: vscode.ExtensionContext, options: ConfigPanelOptions): Promise<void> [async]
Uses: buildTreeRecursive (calls), buildFolderTree (calls), detectAvailableTypes (async-calls, calls), countRelationshipsByType (async-calls, calls), generateConfigHTML (calls), renderFolderTree (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), hasSelectedDescendants (calls)
---

generateConfigHTML (module)
Methods:
- + generateConfigHTML(folderTree: any, extensions: any[], config: any, availableTypes: string[], availableRelTypes: string[], diagramName: string, mode: string, relationshipCounts: Record<string, number>): string
Uses: buildTreeRecursive (calls), buildFolderTree (calls), detectAvailableTypes (async-calls, calls), countRelationshipsByType (async-calls, calls), renderFolderTree (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), hasSelectedDescendants (calls)
Used By: ConfigPanelOptions (calls), detectAvailableTypes (calls), countRelationshipsByType (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), buildFolderTree (calls), buildTreeRecursive (calls), showConfigPanel (calls), renderFolderTree (calls), hasSelectedDescendants (calls)
---

renderFolderTree (module)
Methods:
- + renderFolderTree(node: any, level: number): string
Uses: buildTreeRecursive (calls), buildFolderTree (calls), detectAvailableTypes (async-calls, calls), countRelationshipsByType (async-calls, calls), generateConfigHTML (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), hasSelectedDescendants (calls)
Used By: ConfigPanelOptions (calls), detectAvailableTypes (calls), countRelationshipsByType (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), buildFolderTree (calls), buildTreeRecursive (calls), showConfigPanel (calls), generateConfigHTML (calls), hasSelectedDescendants (calls)
---

hasSelectedDescendants (module)
Methods:
- + hasSelectedDescendants(node: any): boolean
Uses: buildTreeRecursive (calls), buildFolderTree (calls), detectAvailableTypes (async-calls, calls), countRelationshipsByType (async-calls, calls), generateConfigHTML (calls), renderFolderTree (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls)
Used By: ConfigPanelOptions (calls), detectAvailableTypes (calls), countRelationshipsByType (calls), getTypeLabel (calls), getRelTypeLabel (calls), getRelTypeDescription (calls), buildFolderTree (calls), buildTreeRecursive (calls), showConfigPanel (calls), generateConfigHTML (calls), renderFolderTree (calls)
---

showGitChanges (module)
Methods:
- + showGitChanges(context: vscode.ExtensionContext): Promise<void> [async]
---

DiagramGeneratorService
Methods:
- + generateReactFlowData(diagramData: DiagramData): { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] } [static]
- - generateNodes(classes: ClassInfo[]): ReactFlowNode[] [static]
- - generateEdges(diagramData: DiagramData): ReactFlowEdge[] [static]
- - getEdgeStyle(umlType: UMLRelationshipType): { type: string; label?: string; animated: boolean; style: Record<string, any> } [static]
---

DiagramFolderNode (interface)
Properties:
- + name: string
- + fullPath: string
- + children: Map<string, DiagramFolderNode>
- + classes: ReactFlowNode[]
Uses: ReactFlowNode (composition, imports, generic)
---

FolderStructureBuilder
Methods:
- + build(nodes: ReactFlowNode[]): DiagramFolderNode [static]
- - collapsePassThroughFolders(folder: DiagramFolderNode): void [static]
- + logStructure(folder: DiagramFolderNode, indent: any): void [static]
- + countClasses(folder: DiagramFolderNode): number [static]
- + countFolders(folder: DiagramFolderNode): number [static]
---

index (module)
---

LayoutConfig (interface)
Properties:
- + horizontalSpacing: number
- + verticalSpacing: number
- + folderPadding: number
- + classSpacing: number
Used By: HierarchicalLayoutCalculator (composition, parameter)
---

Position (interface)
Properties:
- + x: number
- + y: number
Used By: FolderSize (implements)
---

FolderSize (interface)
Implements: Position
Properties:
- + width: number
- + height: number
Uses: Position (implements)
---

HierarchicalLayoutCalculator
Properties:
- - config: LayoutConfig
Methods:
- + constructor(config: Partial<LayoutConfig>): void
- + calculate(folder: DiagramFolderNode, x: number, y: number): { width: number; height: number }
Uses: LayoutConfig (composition, parameter)
---

EnrichmentContext (interface)
Properties:
- + workspacePath: string
- + classes: ClassInfo[]
- + relationships: ClassRelationship[]
Uses: ClassInfo (composition, imports), ClassRelationship (composition, imports)
---

EnrichmentResult (interface)
Properties:
- + enhancedClasses: ClassInfo[]
- + newRelationships: ClassRelationship[]
- + metadata: {
		framework: string;
		version?: string;
		features: string[];
	}
Uses: ClassInfo (composition, imports), ClassRelationship (composition, imports)
---

AbstractEnricher (abstract)
Properties:
- + framework: string [readonly]
- + priority: number [readonly]
Methods:
- + detect(context: EnrichmentContext): boolean
- + enrich(context: EnrichmentContext): Promise<EnrichmentResult>
- + getFilePatterns(): string[]
Used By: EnricherRegistry (composition, returns, parameter, imports, generic), DjangoEnricher (extends, imports), NextJSEnricher (extends, imports), SpringBootEnricher (extends, imports)
---

EnricherRegistry
Properties:
- - enrichers: AbstractEnricher[]
Methods:
- + constructor(): void
- - register(enricher: AbstractEnricher): void
- + detectFrameworks(context: EnrichmentContext): AbstractEnricher[]
- + enrichAll(context: EnrichmentContext): Promise<EnrichmentContext> [async]
- + getRegisteredEnrichers(): AbstractEnricher[]
Uses: AbstractEnricher (composition, returns, parameter, imports, generic)
---

DjangoEnricher
Extends: AbstractEnricher
Properties:
- + framework: any [readonly]
- + priority: any [readonly]
Methods:
- + detect(context: EnrichmentContext): boolean
- - checkDjangoFiles(workspacePath: string): boolean
- + enrich(context: EnrichmentContext): Promise<EnrichmentResult> [async]
- + getFilePatterns(): string[]
- - enrichModels(classes: any[]): void
- - createORMRelationships(classes: any[]): ClassRelationship[]
- - inferTargetModel(propertyName: string, propertyType: string, models: any[]): any | null
- - enrichViews(classes: any[]): void
- - enrichSerializers(classes: any[]): void
- - enrichViewSets(classes: any[]): void
- - createViewModelRelationships(classes: any[]): ClassRelationship[]
- - createViewSerializerRelationships(classes: any[]): ClassRelationship[]
- - createSerializerModelRelationships(classes: any[]): ClassRelationship[]
- - createNestedSerializerRelationships(classes: any[]): ClassRelationship[]
- - createViewTemplateRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[]
- - extractTemplateFromSource(filePath: string, className: string, propertyName: string, workspacePath: string): string | null
- - extractTemplateFromRenderCall(filePath: string, functionName: string, workspacePath: string): string | null
- - findTemplateByPath(templatePath: string, templates: any[]): any | null
- - enrichMiddleware(classes: any[]): void
- - createMiddlewareRelationships(classes: any[]): ClassRelationship[]
- - createURLRouteRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[]
- - findUrlFiles(workspacePath: string): string[]
- - parseUrlFile(filePath: string, classes: any[]): UrlPattern[]
- - extractDynamicParams(routePath: string): DynamicParam[]
- - findViewByName(viewName: string, classes: any[]): any | null
- - createHeuristicRoutes(classes: any[]): ClassRelationship[]
- - inferRouteFromViewName(viewName: string): string | null
- - getClassId(classInfo: any): string
Uses: AbstractEnricher (extends, imports)
---

UrlPattern (interface)
Properties:
- + path: string
- + viewName: string
- + viewClass: any | null
- + dynamicParams: DynamicParam[]
Uses: DynamicParam (composition, generic)
---

DynamicParam (interface)
Properties:
- + type: string
- + name: string
Used By: UrlPattern (composition, generic)
---

NextJSEnricher
Extends: AbstractEnricher
Properties:
- + framework: any [readonly]
- + priority: any [readonly]
Methods:
- + detect(context: EnrichmentContext): boolean
- + enrich(context: EnrichmentContext): Promise<EnrichmentResult> [async]
- + getFilePatterns(): string[]
- - enrichFileBasedRoutes(classes: any[], context: EnrichmentContext): void
- - isNextJSRouteFile(filePath: string): boolean
- - filePathToRoutePath(filePath: string): string
- - identifyMiddleware(classes: any[]): void
- - identifyLayouts(classes: any[]): void
- - identifyPages(classes: any[]): void
- - identifyServerActions(classes: any[]): void
- - createMiddlewareRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[]
- - createLayoutRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[]
- - createServerActionRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[]
- - getClassId(classInfo: any): string
- - getDirectoryPath(filePath: string): string
- - inferServiceRelationships(classes: any[], context: EnrichmentContext): ClassRelationship[]
- - detectJSXComponentUsage(classes: any[], context: EnrichmentContext): ClassRelationship[]
- - detectTypeScriptTypeUsage(classes: any[], context: EnrichmentContext): ClassRelationship[]
- - detectFetchAPICalls(classes: any[], context: EnrichmentContext): ClassRelationship[]
- - detectPageComponents(context: EnrichmentContext): any[]
- - detectServerActions(context: EnrichmentContext): any[]
- - detectMiddleware(context: EnrichmentContext): any[]
- - linkServerActionsToComponents(actions: any[], context: EnrichmentContext): any[]
- - buildMiddlewareChain(middleware: any[]): any[]
Uses: AbstractEnricher (extends, imports)
---

SpringBootEnricher
Extends: AbstractEnricher
Properties:
- + framework: any [readonly]
- + priority: any [readonly]
Methods:
- + detect(context: EnrichmentContext): boolean
- + enrich(context: EnrichmentContext): Promise<EnrichmentResult> [async]
- - detectStereotypes(classInfo: ClassInfo, content: string, features: string[]): void
- - detectEntity(classInfo: ClassInfo, content: string, features: string[]): void
- - detectRepositoryDetails(classInfo: ClassInfo, content: string, features: string[]): void
- - extractHttpRoutes(classInfo: ClassInfo, content: string, enhancedClasses: ClassInfo[], features: string[]): void
- - extractViewNames(classInfo: ClassInfo, content: string, allClasses: ClassInfo[], enhancedClasses: ClassInfo[], newRelationships: ClassRelationship[], features: string[]): void
- - findMatchingJspFile(viewName: string, classes: ClassInfo[]): ClassInfo | undefined
- - detectJpaRelationships(classInfo: ClassInfo, content: string, newRelationships: ClassRelationship[], features: string[]): void
- - detectDependencyInjection(classInfo: ClassInfo, content: string, newRelationships: ClassRelationship[], features: string[]): void
- - inferServiceCalls(classes: ClassInfo[], newRelationships: ClassRelationship[], features: string[]): void
- - isPrimitiveOrCommon(type: string): boolean
- + getFilePatterns(): string[]
Uses: AbstractEnricher (extends, imports)
---

index (module)
---

MarkdownExporter
Methods:
- + toMarkdown(data: DiagramData, diagramName: string): string [static]
- - generateFolderTree(data: DiagramData): string [static]
- - getChangeStatusTag(status: string): string [static]
- - getVisibilitySymbol(visibility: string): string [static]
---

TreeNode (interface)
---

FileChange (interface)
Properties:
- + path: string
- + status: 'modified' | 'added' | 'deleted' | 'renamed'
- + additions: number
- + deletions: number
Used By: GitComparisonResult (composition)
---

GitComparisonResult (interface)
Properties:
- + workspaceName: string
- + currentBranch: string
- + compareTarget: string
- + changes: FileChange[]
Uses: FileChange (composition)
---

GitDiffEnricher
Methods:
- + enrichWithGitDiff(diagramData: DiagramData, workspacePath: string, baseCommit: string): Promise<DiagramData> [static] [async]
- - enrichMembersWithChanges(classInfo: ClassInfo, fileChange: { addedLines: Set<number>; deletedLines: Set<number> }, oldClass: ClassInfo): boolean [static]
- - isChangeInRange(startLine: number, endLine: number, fileChange: { addedLines: Set<number>; deletedLines: Set<number> }): boolean [static]
- - markAllUnchanged(diagramData: DiagramData): DiagramData [static]
---

GitDiffInfo (interface)
Properties:
- + addedFiles: Set<string>
- + deletedFiles: Set<string>
- + modifiedFiles: Set<string>
- + fileChanges: Map<string, FileChangeDetailed>
Uses: FileChangeDetailed (composition, generic)
---

FileChangeDetailed (interface)
Properties:
- + filePath: string
- + status: 'added' | 'deleted' | 'modified'
- + addedLines: Set<number>
- + deletedLines: Set<number>
- + modifiedLines: Set<number>
Used By: GitDiffInfo (composition, generic)
---

GitOperations
Methods:
- + isGitRepository(workspacePath: string): boolean [static]
- + getGitRoot(workspacePath: string): Promise<string | null> [static] [async]
- + getCurrentBranch(workspacePath: string): string [static]
- + getRemoteName(workspacePath: string): string [static]
- + getDiff(workspacePath: string, baseCommit: string): Promise<GitDiffInfo | null> [static] [async]
- - getFileLineDiff(gitRootPath: string, filePath: string, diffCommand: string, fileChanges: Map<string, FileChangeDetailed>): Promise<void> [static] [async]
- + hasUncommittedChanges(workspacePath: string): Promise<boolean> [static] [async]
- + getDeletedFileContent(workspacePath: string, filePath: string, baseCommit: string): Promise<string | null> [static] [async]
- + getFileContentFromHistory(workspacePath: string, filePath: string, baseCommit: string): Promise<string | null> [static] [async]
- + fetchRemote(workspacePath: string, remoteName: string): void [static]
- + getCompareTarget(workspacePath: string, remoteName: string, currentBranch: string): string | null [static]
- + getUncommittedChanges(workspacePath: string): FileChange[] [static]
- + getUnpushedChanges(workspacePath: string, compareTarget: string, existingPaths: Set<string>): FileChange[] [static]
- + analyzeChanges(workspacePath: string, workspaceName: string): Promise<GitComparisonResult | null> [static] [async]
- + getRecentCommits(workspacePath: string, limit: number): Promise<Array<{ hash: string; message: string }>> [static] [async]
---

index (module)
---

CodeParserService
Methods:
- + parseWorkspace(workspacePath: string, config: KrataiConfig): Promise<DiagramData> [static] [async]
- + parseFile(filePath: string): ClassInfo[] [static]
---

FrameworkDetector
Methods:
- + detect(workspacePath: string): Set<string> [static]
---

FrameworkEnricherFactory
Properties:
- - enrichers: Map<string, IFrameworkEnricher> [static]
Methods:
- + register(enricher: IFrameworkEnricher): void [static]
- + get(framework: string): IFrameworkEnricher | undefined [static]
- + getSupportedFrameworks(): string[] [static]
- + isSupported(framework: string): boolean [static]
Uses: IFrameworkEnricher (composition, returns, parameter, imports, generic)
---

IFrameworkEnricher (interface)
Properties:
- + name: string
Methods:
- + enrich(classes: ClassInfo[], workspacePath: string): void
- + extractRelationships(classes: ClassInfo[]): ClassRelationship[]
Used By: FrameworkEnricherFactory (composition, returns, parameter, imports, generic)
---

index (module)
---

HttpCallDetector
Methods:
- + buildRouteMap(classes: ClassInfo[]): Map<string, ClassInfo>
- - filePathToUrlPattern(filePath: string): string
- + detectHttpCalls(sourceCode: string, filePath: string): Array<{ method: string; url: string; lineNumber: number }>
- + createHttpRelationships(classes: ClassInfo[], routeMap: Map<string, ClassInfo>): ClassRelationship[]
---

index (module)
---

AbstractParserStrategy (abstract)
Properties:
- + supportedExtensions: string[]
Methods:
- + parseFile(filePath: string): ClassInfo[]
- + extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[]
- # createClassId(classInfo: ClassInfo): string
- # createRelationshipsToTargets(fromInfo: ClassInfo, targetName: string, classMap: Map<string, ClassInfo[]>, type: ClassRelationship['type'], filter: (target: ClassInfo) => boolean): ClassRelationship[]
Used By: HTMLParser (extends, imports), HTTPParser (extends, imports), JavaParser (extends, imports), JavaScriptParser (extends, imports), PHPParser (extends, imports, calls-super), ParserFactory (composition, returns, parameter, imports, generic), PythonParser (extends, imports), TypeScriptParser (extends, imports)
---

HTMLParser
Extends: AbstractParserStrategy
Properties:
- + supportedExtensions: any
Methods:
- + parseFile(filePath: string): ClassInfo[]
- + extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[]
- + parse(filePath: string, workspacePath: string): Promise<{ classes: ClassInfo[]; relationships: ClassRelationship[] }> [async]
Uses: AbstractParserStrategy (extends, imports)
Used By: ClassInfo (composition)
---

HTTPParser
Extends: AbstractParserStrategy
Properties:
- + supportedExtensions: any
Methods:
- + parseFile(filePath: string): ClassInfo[]
- + extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[]
- - extractDecoratorRoutes(sourceCode: string, filePath: string): ClassInfo[]
- - extractFileBasedRoutes(filePath: string): ClassInfo[]
- - filePathToRoutePath(filePath: string): string
- - buildRouteMap(classes: ClassInfo[]): Map<string, ClassInfo>
- - extractHttpCalls(sourceCode: string, classInfo: ClassInfo, routeMap: Map<string, ClassInfo>): ClassRelationship[]
- - linkRoutesToHandlers(classes: ClassInfo[]): ClassRelationship[]
Uses: AbstractParserStrategy (extends, imports)
Used By: ParserFactory (composition, returns, imports, creates, generic), ClassInfo (composition)
---

JavaParser
Extends: AbstractParserStrategy
Properties:
- + supportedExtensions: any
Methods:
- + parseFile(filePath: string): ClassInfo[]
- - removeComments(code: string): string
- - extractPackage(code: string): string
- - extractClasses(code: string, filePath: string, packageName: string): ClassInfo[]
- - extractInterfaces(code: string, filePath: string, packageName: string): ClassInfo[]
- - extractEnums(code: string, filePath: string, packageName: string): ClassInfo[]
- - extractClassBody(code: string, startIndex: number): string
- - extractFields(classBody: string, className: string): PropertyInfo[]
- - extractMethods(classBody: string, className: string): MethodInfo[]
- - parseParameters(paramsString: string): Array<{ name: string; type: string }>
- - smartSplit(str: string, delimiter: string): string[]
- + extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[]
- - extractTypeName(typeStr: string): string
- - extractGenericTypes(typeStr: string): string[]
Uses: AbstractParserStrategy (extends, imports)
---

JavaScriptParser
Extends: AbstractParserStrategy
Properties:
- + supportedExtensions: any
Methods:
- + parseFile(filePath: string): ClassInfo[]
- + extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[]
- - extractMethodCallRelationships(classInfo: ClassInfo, allClassNames: Set<string>, classMap: Map<string, ClassInfo[]>): ClassRelationship[]
- - extractClassInfo(node: ts.ClassDeclaration, filePath: string, typeChecker: ts.TypeChecker): ClassInfo
- - extractClassExpressionInfo(name: string, node: ts.ClassExpression, filePath: string, typeChecker: ts.TypeChecker): ClassInfo
- - extractClassMembers(name: string, node: ts.ClassDeclaration | ts.ClassExpression, filePath: string, typeChecker: ts.TypeChecker): ClassInfo
- - extractConstructorProperties(node: ts.ConstructorDeclaration, sourceFile: ts.SourceFile, typeChecker: ts.TypeChecker): PropertyInfo[]
- - extractModuleInfo(sourceFile: ts.SourceFile, filePath: string): ClassInfo | null
- - extractTypeNames(typeString: string): string[]
- - getTypeFromJSDoc(node: ts.Node, typeChecker: ts.TypeChecker): string | undefined
- - getReturnTypeFromJSDoc(node: ts.MethodDeclaration, typeChecker: ts.TypeChecker): string | undefined
Uses: AbstractParserStrategy (extends, imports)
---

PHPParser
Extends: AbstractParserStrategy
Properties:
- + supportedExtensions: any
- - parser: any
Methods:
- + constructor(): void
- + parseFile(filePath: string): ClassInfo[]
- - walkAST(node: any, callback: (node: any) => void): void
- - extractClassInfo(node: any, filePath: string): ClassInfo
- - extractInterfaceInfo(node: any, filePath: string): ClassInfo
- - extractTraitInfo(node: any, filePath: string): ClassInfo
- - extractProperties(node: any): PropertyInfo[]
- - extractMethod(node: any): MethodInfo
- - extractParameters(params: any[]): Array<{ name: string; type: string; optional: boolean }>
- - getTypeName(typeNode: any): string
- + extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[]
- - extractTypeNames(typeString: string): string[]
- - isCustomType(typeName: string): boolean
- - extractModuleFunctions(ast: any, classMethods: Set<string>): MethodInfo[]
Uses: AbstractParserStrategy (extends, imports, calls-super)
---

ParserFactory
Properties:
- - parsers: Map<string, AbstractParserStrategy>
- - httpParser: HTTPParser
Methods:
- + constructor(): void
- - register(parser: AbstractParserStrategy): void
- + getParser(filePath: string): AbstractParserStrategy | undefined
- + getHttpParser(): HTTPParser
- + getSupportedExtensions(): string[]
Uses: AbstractParserStrategy (composition, returns, parameter, imports, generic), HTTPParser (composition, returns, imports, creates, generic)
---

PythonParser
Extends: AbstractParserStrategy
Properties:
- + supportedExtensions: any
Methods:
- + parseFile(filePath: string): ClassInfo[]
- - finishClass(classData: any, filePath: string, totalLines: number): ClassInfo
- - extractModuleFunctions(lines: string[]): MethodInfo[]
- + extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[]
- - extractTypeNames(typeString: string): string[]
Uses: AbstractParserStrategy (extends, imports)
---

TypeScriptParser
Extends: AbstractParserStrategy
Properties:
- + supportedExtensions: any
Methods:
- + parseFile(filePath: string): ClassInfo[]
- - hasImportsOrExports(sourceFile: ts.SourceFile): boolean
- + extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string): ClassRelationship[]
- - extractAdvancedRelationships(sourceFile: ts.SourceFile, classInfo: ClassInfo, allClassNames: Set<string>, classMap: Map<string, ClassInfo[]>): ClassRelationship[]
- - extractModuleLevelInstantiations(filePath: string, allClassNames: Set<string>, workspacePath: string): Set<string>
- - extractImports(sourceFile: ts.SourceFile, currentFilePath: string, allClassNames: Set<string>, workspacePath: string): Set<string>
- - extractTypeNames(typeString: string): string[]
- - extractClassInfo(node: ts.ClassDeclaration, filePath: string): ClassInfo
- - extractInterfaceInfo(node: ts.InterfaceDeclaration, filePath: string): ClassInfo
- - extractProperty(node: ts.PropertyDeclaration): PropertyInfo
- - extractPropertySignature(node: ts.PropertySignature): PropertyInfo
- - extractMethod(node: ts.MethodDeclaration): MethodInfo
- - extractMethodSignature(node: ts.MethodSignature): MethodInfo
- - extractConstructor(node: ts.ConstructorDeclaration): MethodInfo
- - extractModuleInfo(sourceFile: ts.SourceFile, filePath: string): ClassInfo | null
- - getVisibility(node: ts.PropertyDeclaration | ts.MethodDeclaration): 'public' | 'private' | 'protected'
- - extractFunctionAsModule(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile, filePath: string): ClassInfo
- - extractArrowFunctionAsModule(declaration: ts.VariableDeclaration, statement: ts.VariableStatement, sourceFile: ts.SourceFile, filePath: string): ClassInfo
Uses: AbstractParserStrategy (extends, imports)
---

WorkspaceScanner
Properties:
- - DEFAULT_EXCLUSIONS: any [static] [readonly]
Methods:
- + selectFolders(workspacePath: string): string[] [static]
- - collectAllSubdirectories(workspacePath: string, relativePath: string, maxDepth: number, currentDepth: number): string[] [static]
- - detectTopLevelSourceFolders(workspacePath: string): string[] [static]
- - hasCodeInTree(folderPath: string, maxDepth: number, currentDepth: number): boolean [static]
- - shouldExcludeFolder(name: string): boolean [static]
- - hasParseableFiles(folderPath: string, maxCheck: number): boolean [static]
- + scanExtensionCounts(workspacePath: string): ExtensionInfo[] [static]
- - scanExtensions(workspacePath: string, relativePath: string, extensionMap: Map<string, number>): void [static]
- + getFilesToParse(workspacePath: string, config: KrataiConfig): string[] [static]
- - scanForFiles(dir: string, workspacePath: string, config: KrataiConfig, files: string[]): void [static]
- - isExcludedFolder(folderName: string): boolean [static]
- - shouldIncludeFile(filePath: string, selectedExtensions: string[]): boolean [static]
---

index (module)
---

ExtensionConfig (interface)
Properties:
- + telemetry: {
		connectionString?: string;
	}
Uses: loadConfig (calls)
---

loadConfig (module)
Methods:
- + loadConfig(): ExtensionConfig
Used By: ExtensionConfig (calls), TelemetryService (calls)
---

TelemetryService
Methods:
- + initialize(connectionString: string): Promise<void> [static] [async]
- + dispose(): void [static]
- + trackGenerateClassDiagram(classCount: number, folderCount: number, relationshipCount: number): void [static]
- + trackShowGitChanges(changedFiles: number): void [static]
- + trackOpenCommunity(): void [static]
- + trackOpenSettings(): void [static]
- + trackMcpListDiagrams(diagramCount: number): void [static]
- + trackMcpGetDiagram(classCount: number, relationshipCount: number): void [static]
- + trackMcpCreateDiagram(classCount: number, relationshipCount: number, folderCount: number): void [static]
- + trackError(command: string, error: string): void [static]
Uses: loadConfig (calls)
---

ViewManager
Properties:
- - VIEWS_DIR: any [static] [readonly]
- - REGISTRY_FILE: any [static] [readonly]
Methods:
- + slugify(name: string): string [static]
- - getViewsDir(workspacePath: string): string [static]
- - getRegistryPath(workspacePath: string): string [static]
- - getViewConfigPath(workspacePath: string, viewId: string): string [static]
- - ensureViewsDir(workspacePath: string): void [static]
- - loadRegistry(workspacePath: string): Promise<DiagramViewRegistry> [static] [async]
- - saveRegistry(workspacePath: string, registry: DiagramViewRegistry): Promise<void> [static] [async]
- + createView(workspacePath: string, name: string, config: KrataiConfig): Promise<DiagramView> [static] [async]
- + saveViewConfig(workspacePath: string, viewId: string, config: KrataiConfig): Promise<void> [static] [async]
- + loadViewConfig(workspacePath: string, viewId: string): Promise<KrataiConfig> [static] [async]
- + listViews(workspacePath: string): Promise<DiagramView[]> [static] [async]
- + getView(workspacePath: string, viewId: string): Promise<DiagramView | undefined> [static] [async]
- + updateLastGenerated(workspacePath: string, viewId: string): Promise<void> [static] [async]
- + updateView(workspacePath: string, viewId: string, updates: Partial<Pick<DiagramView, 'name'>>): Promise<string> [static] [async]
- + deleteView(workspacePath: string, viewId: string): Promise<void> [static] [async]
---

index (module)
---

ConfigService
Properties:
- - CONFIG_FILE: any [static] [readonly]
Methods:
- + getDefaultConfig(): KrataiConfig [static]
- + generateSmartDefaults(workspacePath: string): KrataiConfig [static]
- - detectProjectExtensions(workspacePath: string): string[] [static]
- + getProjectInfo(config: KrataiConfig): string [static]
- + getSelectedFolders(config: KrataiConfig): string[] [static]
- + loadConfig(workspacePath: string): Promise<KrataiConfig> [static] [async]
- + saveConfig(workspacePath: string, config: KrataiConfig): Promise<void> [static] [async]
---

index (module)
---

UMLMapper
Methods:
- + mapToUMLType(detailedType: string): UMLRelationshipType [static]
- + getUMLLabel(umlType: UMLRelationshipType): string [static]
---

ClassInfo (interface)
Properties:
- + name: string
- + filePath: string
- + properties: PropertyInfo[]
- + methods: MethodInfo[]
- + extends: string
- + implements: string[]
- + isInterface: boolean
- + isAbstract: boolean
- + isModule: boolean
- + classType: | 'class' 
		| 'interface' 
		| 'abstract' 
		| 'module' 
		| 'enum' 
		| 'function'
		// HTTP types (HTTPParser)
		| 'route'
		// Template types (HTMLParser)
		| 'template'      // HTML/Blade/Twig template files
		// Framework types (Enrichers)
		| 'middleware'    // Next.js/Laravel middleware
		| 'layout'        // Next.js layout component
		| 'page'          // Next.js page component
		| 'view'          // Spring MVC view (JSP/Thymeleaf)
		| 'server-action' // Next.js server action
		| 'controller'    // MVC controller (returns views)
		| 'rest-controller' // REST API controller (returns JSON)
		| 'service'       // Service layer
		| 'repository'    // Data access layer
		| 'entity'        // JPA/ORM entity
		| 'configuration' // Spring @Configuration
		| 'exception-handler'
- + changeStatus: 'added' | 'deleted' | 'modified' | 'unchanged'
- + routeMeta: {
		path: string;        // '/api/users/:id'
		method: string;      // 'GET', 'POST', '*' (any)
		definedIn?: string;  // Source file path
		pathVariables?: string[]; // ['id', 'postId']
	}
- + repositoryMeta: {
		entityType?: string;  // 'User' from JpaRepository<User, Long>
		idType?: string;      // 'Long' from JpaRepository<User, Long>
	}
- + entityMeta: {
		tableName?: string;   // From @Table(name = "users")
		primaryKey?: string;  // Field marked with @Id
	}
Uses: PropertyInfo (composition, imports), MethodInfo (composition, imports), HTTPParser (composition), HTMLParser (composition)
Used By: EnrichmentContext (composition, imports), EnrichmentResult (composition, imports), DiagramData (composition, imports), ReactFlowNode (composition, imports)
---

ClassRelationship (interface)
Properties:
- + from: string
- + to: string
- + type: | 'extends' 
		| 'implements' 
		| 'uses' 
		| 'composition'
		// Type relationships
		| 'returns'
		| 'parameter'
		| 'generic'
		// Method calls
		| 'calls'
		| 'calls-super'
		| 'calls-static'
		| 'async-calls'
		// Factory/creation
		| 'creates'
		// Module graph
		| 'imports'
		| 're-exports'
		// Higher-order
		| 'callback'
		// HTTP relationships
		| 'http-call'    // Client calls HTTP endpoint
		| 'routes-to'    // Route maps to handler
		// Framework-specific relationships (added by enrichers)
		| 'server-action'   // Next.js: Form component → Server action
		| 'middleware'      // Next.js/Laravel: Middleware → Protected route
		| 'data-fetching'   // Next.js: Data fetching function → Page component
		| 'layout-wraps'    // Next.js: Layout → Nested page/layout
		| 'injects'         // Laravel/Django: DI container → Service
		| 'observes'        // Laravel: Observer → Model
		| 'triggers'        // Django: Signal → Handler
		// ORM relationships
		| 'belongs-to'      // Django/Laravel: ForeignKey, belongsTo
		| 'has-many'        // Django/Laravel: Reverse ForeignKey, hasMany
		| 'many-to-many'    // Django/Laravel: ManyToManyField
		| 'one-to-one'      // Django/Laravel: OneToOneField
		// JPA relationships (Spring Boot)
		| 'one-to-many'     // JPA @OneToMany: User -> List<Post>
		| 'many-to-one'     // JPA @ManyToOne: Post -> User
		// Django REST Framework
		| 'serializes'      // DRF: Serializer → Model
		| 'protected-by'    // Middleware/Guard → View/Route
		// Template rendering
		| 'renders'        // View/Controller → Template file
		| string[]
- + metadata: {
		[key: string]: any;
	}
Used By: EnrichmentContext (composition, imports), EnrichmentResult (composition, imports), DiagramData (composition, imports)
---

DiagramData (interface)
Properties:
- + classes: ClassInfo[]
- + relationships: ClassRelationship[]
Uses: ClassInfo (composition, imports), ClassRelationship (composition, imports)
---

MethodInfo (interface)
Properties:
- + name: string
- + parameters: ParameterInfo[]
- + returnType: string
- + visibility: 'public' | 'private' | 'protected'
- + isStatic: boolean
- + isAsync: boolean
- + changeStatus: 'added' | 'deleted' | 'modified' | 'unchanged'
- + lineNumber: number
- + endLineNumber: number
- + hasInternalCalls: boolean
Uses: ParameterInfo (composition, imports)
Used By: ClassInfo (composition, imports)
---

ParameterInfo (interface)
Properties:
- + name: string
- + type: string
- + optional: boolean
Used By: MethodInfo (composition, imports)
---

PropertyInfo (interface)
Properties:
- + name: string
- + type: string
- + visibility: 'public' | 'private' | 'protected'
- + isStatic: boolean
- + isReadonly: boolean
- + changeStatus: 'added' | 'deleted' | 'modified' | 'unchanged'
- + lineNumber: number
- + endLineNumber: number
Used By: ClassInfo (composition, imports)
---

index (module)
---

ConfigFolderNode (interface)
Properties:
- + path: string
- + name: string
- + selected: boolean
- + children: ConfigFolderNode[]
- + fileCount: number
---

DiagramView (interface)
Properties:
- + id: string
- + name: string
- + config: KrataiConfig
- + createdAt: string
- + lastGenerated: string
Uses: KrataiConfig (composition, imports)
Used By: DiagramViewRegistry (composition)
---

DiagramViewRegistry (interface)
Properties:
- + views: DiagramView[]
Uses: DiagramView (composition)
---

ExtensionInfo (interface)
Properties:
- + extension: string
- + count: number
- + selected: boolean
---

ReactFlowEdge (interface)
Properties:
- + id: string
- + source: string
- + target: string
- + type: string
- + label: string
- + animated: boolean
- + style: Record<string, any>
- + metadata: {
		umlType: UMLRelationshipType;
		detailedTypes: string[];
	}
---

ReactFlowNode (interface)
Properties:
- + id: string
- + type: string
- + position: { x: number; y: number }
- + data: {
		label: string;
		classInfo: ClassInfo;
	}
Uses: ClassInfo (composition, imports)
Used By: DiagramFolderNode (composition, imports, generic)
---

index (module)
---

FolderConfig (interface)
Properties:
- + selected: boolean
- + expanded: boolean
- + order: number | null
Used By: KrataiConfig (composition)
---

KrataiConfig (interface)
Properties:
- + selectedFolders: string[]
- + folders: Record<string, FolderConfig>
- + selectedExtensions: string[]
- + respectGitignore: boolean
- + followSymlinks: boolean
- + classTypeFilters: {            // Dynamic filters for class types
		[type: string]: boolean;    // e.g., { "class": true, "interface": false, "module": true }
	}
- + relationshipTypeFilters: {     // Dynamic filters for relationship types
		[type: string]: boolean;    // e.g., { "extends": true, "implements": false, "calls": true }
	}
- + gitDiff: {
		enabled?: boolean;          // Show git diff visualization
		baseCommit?: string;        // Compare against this commit (default: 'HEAD~1')
	}
- + detectHttpCalls: boolean
- + frameworkEnrichment: boolean
Uses: FolderConfig (composition)
Used By: DiagramView (composition, imports), FolderBoxRenderer (composition, parameter, imports)
---

index (module)
---

ClassDiagramView
Methods:
- + generate(nodes: ReactFlowNode[], edges: ReactFlowEdge[], workspaceName: string, config: KrataiConfig, iconUri: string): string [static]
- - generateHTML(workspaceName: string, classCount: number, edgeCount: number, folderCount: number, folderHTML: string, edges: ReactFlowEdge[], iconUri: string): string [static]
---

ClassBoxRenderer
Properties:
- - boxWidth: number
Methods:
- + constructor(boxWidth: number): void
- + render(classInfo: ClassInfo, relationshipMap: Map<string, Array<{target: string, type: string}>>): string
- - escapeHtml(text: string): string
- - renderHeader(classInfo: ClassInfo, isModule: boolean, displayName: string): string
- - renderProperties(classInfo: ClassInfo, isModule: boolean): string
- - renderMethods(classInfo: ClassInfo, isModule: boolean): string
- - truncateType(type: string): string
- - truncateParams(parameters: any[]): string
- - getVisibilityColor(visibility: 'public' | 'private' | 'protected'): string
- - getVisibilitySymbol(visibility: 'public' | 'private' | 'protected'): string
- - getChangeStatusBgColor(status: 'added' | 'deleted' | 'modified' | 'unchanged'): string
- - getMemberChangeStatusBgColor(status: 'added' | 'deleted' | 'modified' | 'unchanged'): string
---

FolderBoxRenderer
Properties:
- - config: KrataiConfig
Methods:
- + constructor(config: KrataiConfig): void
- + renderAll(folder: DiagramFolderNode): string
- - collectLeafFolders(folder: DiagramFolderNode): DiagramFolderNode[]
- - sortFoldersByOrder(folders: DiagramFolderNode[]): DiagramFolderNode[]
- - getFolderOrder(folder: DiagramFolderNode): number | null
- - getLayerWeight(fullPath: string, folderName: string): number
- - isVirtualBox(fullPath: string, folderName: string): boolean
- - analyzeForKeywords(text: string): number
- - escapeHtml(text: string): string
- - renderLeafFolder(folder: DiagramFolderNode): string
- - getFolderIcon(folderName: string): string
Uses: KrataiConfig (composition, parameter, imports)
---

RelationshipRenderer
Properties:
- - boxWidth: number
- - boxHeight: number
Methods:
- + constructor(boxWidth: number, boxHeight: number): void
- + renderAll(edges: ReactFlowEdge[], classPositions: Map<string, Position>): string
- - render(edge: ReactFlowEdge, classPositions: Map<string, Position>): string
- - calculateCurve(sourceX: number, sourceY: number, targetX: number, targetY: number): void
- - getEdgeColor(type: string): string
- - getDashArray(type: string): string
- - getMarkerEnd(type: string): string
- + renderMarkerDefs(): string
---

GitChangesView
Methods:
- + generate(result: GitComparisonResult, iconUri: string): string [static]
---

KrataiTreeItem
Extends: vscode.TreeItem
Properties:
- + label: string [readonly]
- + commandId: string [readonly]
- + iconName: string [readonly]
- + collapsibleState: vscode.TreeItemCollapsibleState [readonly]
- + contextValue: string [readonly]
- + viewId: string [readonly]
Methods:
- + constructor(label: string, commandId: string, iconName: string, collapsibleState: vscode.TreeItemCollapsibleState, contextValue: string, viewId: string): void
Used By: KrataiTreeProvider (composition, returns, parameter, creates, generic)
---

KrataiTreeProvider
Implements: vscode.TreeDataProvider
Properties:
- - _onDidChangeTreeData: vscode.EventEmitter<KrataiTreeItem | undefined | null | void>
- + onDidChangeTreeData: vscode.Event<KrataiTreeItem | undefined | null | void> [readonly]
- - workspacePath: string | undefined
Methods:
- + constructor(): void
- + refresh(): void
- + getTreeItem(element: KrataiTreeItem): vscode.TreeItem
- + getChildren(element: KrataiTreeItem): Promise<KrataiTreeItem[]> [async]
Uses: KrataiTreeItem (composition, returns, parameter, creates, generic)
---

GET /users (route)
---

GET /path (route)
---

POST /path (route)
---

