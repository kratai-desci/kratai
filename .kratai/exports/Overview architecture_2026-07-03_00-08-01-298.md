# Overview architecture

**Generated:** 7/3/2026, 7:08:01 AM

## 📊 Summary

- **Total Classes:** 92
- **Total Relationships:** 644

**Class Types:**
- 📁 module: 26
- 🔷 interface: 28
- 📦 class: 33
- 🔶 abstract: 2
- 🌐 route: 3

**Relationship Types:**
- calls: 238
- composition: 249
- implements: 9
- extends: 148

---

## 📖 Symbol Legend

**Visibility (UML Standard):**
- `+` = public
- `-` = private
- `#` = protected

**Git Status:**
- **[+ ADDED]** = newly added code
- **[- DELETED]** = removed code
- **[~ MODIFIED]** = changed code

---

## 📦 Classes (92)

**File:** `src/commands/generateClassDiagram.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `generateClassDiagram(context: vscode.ExtensionContext)`: Promise<void> _[async]_ _[line 13-40]_

---

**File:** `src/commands/generateClassDiagram.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `generateClassDiagramDirect(context: vscode.ExtensionContext)`: Promise<void> _[async]_ _[line 43-236]_

---

**File:** `src/commands/generateDiagramFromView.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `generateDiagramFromView(context: vscode.ExtensionContext, viewId: string)`: Promise<void> _[async]_ _[line 7-44]_

---

**File:** `src/commands/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/commands/showConfigPanel.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `mode`: 'create' | 'edit' _[line 11]_
- + `viewName`: string _[line 12]_
- + `viewId`: string _[line 13]_

---

**File:** `src/commands/showConfigPanel.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `detectAvailableTypes(workspacePath: string)`: Promise<string[]> _[async]_ _[line 16-42]_

---

**File:** `src/commands/showConfigPanel.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `getTypeLabel(type: string)`: string _[line 44-53]_

---

**File:** `src/commands/showConfigPanel.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `getRelTypeLabel(type: string)`: string _[line 55-91]_

---

**File:** `src/commands/showConfigPanel.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `getRelTypeDescription(type: string)`: string _[line 93-129]_

---

**File:** `src/commands/showConfigPanel.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `showConfigPanel(context: vscode.ExtensionContext, options: ConfigPanelOptions)`: Promise<void> _[async]_ _[line 131-321]_

---

**File:** `src/commands/showConfigPanel.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `generateConfigHTML(folderTree: any, extensions: any[], config: any, availableTypes: string[], availableRelTypes: string[], diagramName: string, mode: string)`: string _[line 323-840]_

---

**File:** `src/commands/showConfigPanel.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `renderFolderTree(node: any, level: number)`: string _[line 842-866]_

---

**File:** `src/commands/showGitChanges.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `showGitChanges(context: vscode.ExtensionContext)`: Promise<void> _[async]_ _[line 6-50]_

---

**File:** `src/extension.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `activate(context: vscode.ExtensionContext)`: void _[line 11-101]_

---

**File:** `src/extension.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `deactivate()`: void _[line 104]_

---

**File:** `src/services/config/configService.ts`


**Properties:**

- - `CONFIG_FILE`: any _[static]_ _[readonly]_ _[line 7]_

**Methods:**

- + `getDefaultConfig()`: KrataiConfig _[static]_ _[line 9-21]_
- + `generateSmartDefaults(workspacePath: string)`: KrataiConfig _[static]_ _[line 23-37]_
- - `detectFileExtensions(workspacePath: string)`: string[] _[static]_ _[line 39-112]_
- + `getProjectInfo(config: KrataiConfig)`: string _[static]_ _[line 114-122]_
- + `loadConfig(workspacePath: string)`: Promise<KrataiConfig> _[static]_ _[async]_ _[line 124-145]_
- + `saveConfig(workspacePath: string, config: KrataiConfig)`: Promise<void> _[static]_ _[async]_ _[line 147-162]_
- + `shouldIncludeFolder(folderPath: string, config: KrataiConfig)`: boolean _[static]_ _[line 164-186]_
- + `shouldIncludeFile(filePath: string, config: KrataiConfig)`: boolean _[static]_ _[line 188-191]_
- - `collectAllFolders(workspacePath: string, currentPath: string, folders: string[])`: string[] _[static]_ _[line 197-232]_

---

**File:** `src/services/config/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/services/diagram/diagramGeneratorService.ts`


**Methods:**

- + `generateReactFlowData(diagramData: DiagramData)`: { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] } _[static]_ _[line 6-11]_
- - `generateNodes(classes: ClassInfo[])`: ReactFlowNode[] _[static]_ _[line 13-44]_
- - `generateEdges(diagramData: DiagramData)`: ReactFlowEdge[] _[static]_ _[line 46-64]_
- - `getEdgeStyle(type: string | string[])`: { type: string; label?: string; animated: boolean; style: Record<string, any> } _[static]_ _[line 66-121]_

---

**File:** `src/services/diagram/folderStructure.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `name`: string _[line 4]_
- + `fullPath`: string _[line 5]_
- + `children`: Map<string, DiagramFolderNode> _[line 6]_
- + `classes`: ReactFlowNode[] _[line 7]_

---

**File:** `src/services/diagram/folderStructure.ts`


**Methods:**

- + `build(nodes: ReactFlowNode[])`: DiagramFolderNode _[static]_ _[line 11-71]_
- - `collapsePassThroughFolders(folder: DiagramFolderNode)`: void _[static]_ _[line 77-91]_
- + `logStructure(folder: DiagramFolderNode, indent: any)`: void _[static]_ _[line 96-101]_
- + `countClasses(folder: DiagramFolderNode)`: number _[static]_ _[line 106-110]_
- + `countFolders(folder: DiagramFolderNode)`: number _[static]_ _[line 112-116]_

---

**File:** `src/services/diagram/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/services/diagram/layoutCalculator.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `horizontalSpacing`: number _[line 5]_
- + `verticalSpacing`: number _[line 6]_
- + `folderPadding`: number _[line 7]_
- + `classSpacing`: number _[line 8]_

---

**File:** `src/services/diagram/layoutCalculator.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `x`: number _[line 12]_
- + `y`: number _[line 13]_

---

**File:** `src/services/diagram/layoutCalculator.ts`

**Type:** interface
**Interface:** ✅

**Implements:** Position

**Properties:**

- + `width`: number _[line 17]_
- + `height`: number _[line 18]_

---

**File:** `src/services/diagram/layoutCalculator.ts`


**Properties:**

- - `config`: LayoutConfig _[line 22]_

**Methods:**

- + `constructor(config: Partial<LayoutConfig>)`: void _[line 24-32]_
- + `calculate(folder: DiagramFolderNode, x: number, y: number)`: { width: number; height: number } _[line 34-75]_

---

**File:** `src/services/enrichment/AbstractEnricher.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `workspacePath`: string _[line 7]_
- + `classes`: ClassInfo[] _[line 8]_
- + `relationships`: ClassRelationship[] _[line 9]_

---

**File:** `src/services/enrichment/AbstractEnricher.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `enhancedClasses`: ClassInfo[] _[line 16]_
- + `newRelationships`: ClassRelationship[] _[line 17]_
- + `metadata`: {
		framework: string;
		version?: string;
		features: string[];
	} _[line 18]_

---

**File:** `src/services/enrichment/AbstractEnricher.ts`

**Type:** abstract
**Abstract:** ✅

**Properties:**

- + `framework`: string _[readonly]_ _[line 42]_
- + `priority`: number _[readonly]_ _[line 48]_

**Methods:**

- + `detect(context: EnrichmentContext)`: boolean _[line 56]_
- + `enrich(context: EnrichmentContext)`: Promise<EnrichmentResult> _[line 64]_
- + `getFilePatterns()`: string[] _[line 72]_

---

**File:** `src/services/enrichment/EnricherRegistry.ts`


**Properties:**

- - `enrichers`: AbstractEnricher[] _[line 21]_

**Methods:**

- + `constructor()`: void _[line 23-31]_
- - `register(enricher: AbstractEnricher)`: void _[line 36-40]_
- + `detectFrameworks(context: EnrichmentContext)`: AbstractEnricher[] _[line 48-56]_
- + `enrichAll(context: EnrichmentContext)`: Promise<EnrichmentContext> _[async]_ _[line 67-159]_
- + `getRegisteredEnrichers()`: AbstractEnricher[] _[line 164-166]_

---

**File:** `src/services/enrichment/frameworks/DjangoEnricher.ts`


**Extends:** AbstractEnricher

**Properties:**

- + `framework`: any _[readonly]_ _[line 37]_
- + `priority`: any _[readonly]_ _[line 38]_

**Methods:**

- + `detect(context: EnrichmentContext)`: boolean _[line 43-56]_
- - `checkDjangoFiles(workspacePath: string)`: boolean _[line 61-100]_
- + `enrich(context: EnrichmentContext)`: Promise<EnrichmentResult> _[async]_ _[line 105-189]_
- + `getFilePatterns()`: string[] _[line 194-206]_
- - `enrichModels(classes: any[])`: void _[line 215-225]_
- - `createORMRelationships(classes: any[])`: ClassRelationship[] _[line 230-284]_
- - `inferTargetModel(propertyName: string, propertyType: string, models: any[])`: any | null _[line 289-335]_
- - `enrichViews(classes: any[])`: void _[line 340-353]_
- - `enrichSerializers(classes: any[])`: void _[line 358-367]_
- - `enrichViewSets(classes: any[])`: void _[line 372-381]_
- - `createViewModelRelationships(classes: any[])`: ClassRelationship[] _[line 386-417]_
- - `createViewSerializerRelationships(classes: any[])`: ClassRelationship[] _[line 422-453]_
- - `createSerializerModelRelationships(classes: any[])`: ClassRelationship[] _[line 458-483]_
- - `createNestedSerializerRelationships(classes: any[])`: ClassRelationship[] _[line 488-515]_
- - `createViewTemplateRelationships(classes: any[], context: EnrichmentContext)`: ClassRelationship[] _[line 532-584]_
- - `extractTemplateFromSource(filePath: string, className: string, propertyName: string, workspacePath: string)`: string | null _[line 589-628]_
- - `extractTemplateFromRenderCall(filePath: string, functionName: string, workspacePath: string)`: string | null _[line 633-665]_
- - `findTemplateByPath(templatePath: string, templates: any[])`: any | null _[line 671-688]_
- - `enrichMiddleware(classes: any[])`: void _[line 693-705]_
- - `createMiddlewareRelationships(classes: any[])`: ClassRelationship[] _[line 710-742]_
- - `createURLRouteRelationships(classes: any[], context: EnrichmentContext)`: ClassRelationship[] _[line 747-797]_
- - `findUrlFiles(workspacePath: string)`: string[] _[line 802-829]_
- - `parseUrlFile(filePath: string, classes: any[])`: UrlPattern[] _[line 834-868]_
- - `extractDynamicParams(routePath: string)`: DynamicParam[] _[line 873-888]_
- - `findViewByName(viewName: string, classes: any[])`: any | null _[line 893-904]_
- - `createHeuristicRoutes(classes: any[])`: ClassRelationship[] _[line 909-957]_
- - `inferRouteFromViewName(viewName: string)`: string | null _[line 962-996]_
- - `getClassId(classInfo: any)`: string _[line 1001-1003]_

---

**File:** `src/services/enrichment/frameworks/DjangoEnricher.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `path`: string _[line 1010]_
- + `viewName`: string _[line 1011]_
- + `viewClass`: any | null _[line 1012]_
- + `dynamicParams`: DynamicParam[] _[line 1013]_

---

**File:** `src/services/enrichment/frameworks/DjangoEnricher.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `type`: string _[line 1020]_
- + `name`: string _[line 1021]_

---

**File:** `src/services/enrichment/frameworks/NextJSEnricher.ts`


**Extends:** AbstractEnricher

**Properties:**

- + `framework`: any _[readonly]_ _[line 36]_
- + `priority`: any _[readonly]_ _[line 37]_

**Methods:**

- + `detect(context: EnrichmentContext)`: boolean _[line 42-74]_
- + `enrich(context: EnrichmentContext)`: Promise<EnrichmentResult> _[async]_ _[line 79-146]_
- + `getFilePatterns()`: string[] _[line 151-172]_
- - `enrichFileBasedRoutes(classes: any[], context: EnrichmentContext)`: void _[line 181-215]_
- - `isNextJSRouteFile(filePath: string)`: boolean _[line 220-243]_
- - `filePathToRoutePath(filePath: string)`: string _[line 252-294]_
- - `identifyMiddleware(classes: any[])`: void _[line 299-308]_
- - `identifyLayouts(classes: any[])`: void _[line 313-323]_
- - `identifyPages(classes: any[])`: void _[line 330-342]_
- - `identifyServerActions(classes: any[])`: void _[line 347-357]_
- - `createMiddlewareRelationships(classes: any[], context: EnrichmentContext)`: ClassRelationship[] _[line 362-391]_
- - `createLayoutRelationships(classes: any[], context: EnrichmentContext)`: ClassRelationship[] _[line 396-427]_
- - `createServerActionRelationships(classes: any[], context: EnrichmentContext)`: ClassRelationship[] _[line 432-462]_
- - `getClassId(classInfo: any)`: string _[line 467-469]_
- - `getDirectoryPath(filePath: string)`: string _[line 474-478]_
- - `inferServiceRelationships(classes: any[], context: EnrichmentContext)`: ClassRelationship[] _[line 484-535]_
- - `detectJSXComponentUsage(classes: any[], context: EnrichmentContext)`: ClassRelationship[] _[line 557-625]_
- - `detectTypeScriptTypeUsage(classes: any[], context: EnrichmentContext)`: ClassRelationship[] _[line 644-738]_
- - `detectFetchAPICalls(classes: any[], context: EnrichmentContext)`: ClassRelationship[] _[line 756-822]_
- - `detectPageComponents(context: EnrichmentContext)`: any[] _[line 832-834]_
- - `detectServerActions(context: EnrichmentContext)`: any[] _[line 840-842]_
- - `detectMiddleware(context: EnrichmentContext)`: any[] _[line 848-850]_
- - `linkServerActionsToComponents(actions: any[], context: EnrichmentContext)`: any[] _[line 856-858]_
- - `buildMiddlewareChain(middleware: any[])`: any[] _[line 864-866]_

---

**File:** `src/services/enrichment/frameworks/SpringBootEnricher.ts`


**Extends:** AbstractEnricher

**Properties:**

- + `framework`: any _[readonly]_ _[line 22]_
- + `priority`: any _[readonly]_ _[line 23]_

**Methods:**

- + `detect(context: EnrichmentContext)`: boolean _[line 28-66]_
- + `enrich(context: EnrichmentContext)`: Promise<EnrichmentResult> _[async]_ _[line 71-136]_
- - `detectStereotypes(classInfo: ClassInfo, content: string, features: string[])`: void _[line 141-172]_
- - `detectEntity(classInfo: ClassInfo, content: string, features: string[])`: void _[line 177-198]_
- - `detectRepositoryDetails(classInfo: ClassInfo, content: string, features: string[])`: void _[line 203-231]_
- - `extractHttpRoutes(classInfo: ClassInfo, content: string, enhancedClasses: ClassInfo[], features: string[])`: void _[line 236-328]_
- - `extractViewNames(classInfo: ClassInfo, content: string, allClasses: ClassInfo[], enhancedClasses: ClassInfo[], newRelationships: ClassRelationship[], features: string[])`: void _[line 339-426]_
- - `findMatchingJspFile(viewName: string, classes: ClassInfo[])`: ClassInfo | undefined _[line 435-463]_
- - `detectJpaRelationships(classInfo: ClassInfo, content: string, newRelationships: ClassRelationship[], features: string[])`: void _[line 468-576]_
- - `detectDependencyInjection(classInfo: ClassInfo, content: string, newRelationships: ClassRelationship[], features: string[])`: void _[line 581-628]_
- - `inferServiceCalls(classes: ClassInfo[], newRelationships: ClassRelationship[], features: string[])`: void _[line 634-666]_
- - `isPrimitiveOrCommon(type: string)`: boolean _[line 671-679]_
- + `getFilePatterns()`: string[] _[line 684-696]_

---

**File:** `src/services/enrichment/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/services/export/MarkdownExporter.ts`


**Methods:**

- + `toMarkdown(data: DiagramData, diagramName: string)`: string _[static]_ _[line 7-157]_
- - `getClassTypeStats(data: DiagramData)`: Record<string, number> _[static]_ _[line 162-169]_
- - `getRelationshipStats(data: DiagramData)`: Record<string, number> _[static]_ _[line 174-185]_
- - `getChangeStatusTag(status: string)`: string _[static]_ _[line 190-197]_
- - `getTypeEmoji(type: string)`: string _[static]_ _[line 202-222]_
- - `getVisibilitySymbol(visibility: string)`: string _[static]_ _[line 227-234]_

---

**File:** `src/services/git/contracts.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `path`: string _[line 4]_
- + `status`: 'modified' | 'added' | 'deleted' | 'renamed' _[line 5]_
- + `additions`: number _[line 6]_
- + `deletions`: number _[line 7]_

---

**File:** `src/services/git/contracts.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `workspaceName`: string _[line 11]_
- + `currentBranch`: string _[line 12]_
- + `compareTarget`: string _[line 13]_
- + `changes`: FileChange[] _[line 14]_

---

**File:** `src/services/git/gitDiffEnricher.ts`


**Methods:**

- + `enrichWithGitDiff(diagramData: DiagramData, workspacePath: string, baseCommit: string)`: Promise<DiagramData> _[static]_ _[async]_ _[line 15-174]_
- - `enrichMembersWithChanges(classInfo: ClassInfo, fileChange: { addedLines: Set<number>; deletedLines: Set<number> }, oldClass: ClassInfo)`: boolean _[static]_ _[line 179-298]_
- - `isChangeInRange(startLine: number, endLine: number, fileChange: { addedLines: Set<number>; deletedLines: Set<number> })`: boolean _[static]_ _[line 304-317]_
- - `markAllUnchanged(diagramData: DiagramData)`: DiagramData _[static]_ _[line 322-329]_

---

**File:** `src/services/git/gitOperations.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `addedFiles`: Set<string> _[line 9]_
- + `deletedFiles`: Set<string> _[line 10]_
- + `modifiedFiles`: Set<string> _[line 11]_
- + `fileChanges`: Map<string, FileChangeDetailed> _[line 12]_

---

**File:** `src/services/git/gitOperations.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `filePath`: string _[line 16]_
- + `status`: 'added' | 'deleted' | 'modified' _[line 17]_
- + `addedLines`: Set<number> _[line 18]_
- + `deletedLines`: Set<number> _[line 19]_
- + `modifiedLines`: Set<number> _[line 20]_

---

**File:** `src/services/git/gitOperations.ts`


**Methods:**

- + `isGitRepository(workspacePath: string)`: boolean _[static]_ _[line 31-38]_
- + `getGitRoot(workspacePath: string)`: Promise<string | null> _[static]_ _[async]_ _[line 40-47]_
- + `getCurrentBranch(workspacePath: string)`: string _[static]_ _[line 49-52]_
- + `getRemoteName(workspacePath: string)`: string _[static]_ _[line 54-61]_
- + `getDiff(workspacePath: string, baseCommit: string)`: Promise<GitDiffInfo | null> _[static]_ _[async]_ _[line 69-174]_
- - `getFileLineDiff(gitRootPath: string, filePath: string, diffCommand: string, fileChanges: Map<string, FileChangeDetailed>)`: Promise<void> _[static]_ _[async]_ _[line 179-234]_
- + `hasUncommittedChanges(workspacePath: string)`: Promise<boolean> _[static]_ _[async]_ _[line 236-243]_
- + `getDeletedFileContent(workspacePath: string, filePath: string, baseCommit: string)`: Promise<string | null> _[static]_ _[async]_ _[line 250-260]_
- + `getFileContentFromHistory(workspacePath: string, filePath: string, baseCommit: string)`: Promise<string | null> _[static]_ _[async]_ _[line 265-275]_
- + `fetchRemote(workspacePath: string, remoteName: string)`: void _[static]_ _[line 279-285]_
- + `getCompareTarget(workspacePath: string, remoteName: string, currentBranch: string)`: string | null _[static]_ _[line 287-309]_
- + `getUncommittedChanges(workspacePath: string)`: FileChange[] _[static]_ _[line 311-359]_
- + `getUnpushedChanges(workspacePath: string, compareTarget: string, existingPaths: Set<string>)`: FileChange[] _[static]_ _[line 361-414]_
- + `analyzeChanges(workspacePath: string, workspaceName: string)`: Promise<GitComparisonResult | null> _[static]_ _[async]_ _[line 419-450]_
- + `getRecentCommits(workspacePath: string, limit: number)`: Promise<Array<{ hash: string; message: string }>> _[static]_ _[async]_ _[line 457-475]_

---

**File:** `src/services/git/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/services/parsing/codeParserService.ts`


**Methods:**

- + `parseWorkspace(workspacePath: string, config: KrataiConfig)`: Promise<DiagramData> _[static]_ _[async]_ _[line 14-177]_
- - `findFilesWithConfig(workspacePath: string, config: KrataiConfig)`: string[] _[static]_ _[line 179-194]_
- - `scanDirectory(dir: string, workspacePath: string, config: KrataiConfig, files: string[])`: void _[static]_ _[line 196-219]_
- + `parseFile(filePath: string)`: ClassInfo[] _[static]_ _[line 225-231]_

---

**File:** `src/services/parsing/frameworks/FrameworkDetector.ts`


**Methods:**

- + `detect(workspacePath: string)`: Set<string> _[static]_ _[line 18-79]_

---

**File:** `src/services/parsing/frameworks/FrameworkEnricherFactory.ts`


**Properties:**

- - `enrichers`: Map<string, IFrameworkEnricher> _[static]_ _[line 14]_

**Methods:**

- + `register(enricher: IFrameworkEnricher)`: void _[static]_ _[line 19-21]_
- + `get(framework: string)`: IFrameworkEnricher | undefined _[static]_ _[line 26-28]_
- + `getSupportedFrameworks()`: string[] _[static]_ _[line 33-35]_
- + `isSupported(framework: string)`: boolean _[static]_ _[line 40-42]_

---

**File:** `src/services/parsing/frameworks/IFrameworkEnricher.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `name`: string _[line 13]_

**Methods:**

- + `enrich(classes: ClassInfo[], workspacePath: string)`: void _[line 20]_
- + `extractRelationships(classes: ClassInfo[])`: ClassRelationship[] _[line 27]_

---

**File:** `src/services/parsing/frameworks/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/services/parsing/httpCallDetector.ts`


**Methods:**

- + `buildRouteMap(classes: ClassInfo[])`: Map<string, ClassInfo> _[line 15-38]_
- - `filePathToUrlPattern(filePath: string)`: string _[line 45-58]_
- + `detectHttpCalls(sourceCode: string, filePath: string)`: Array<{ method: string; url: string; lineNumber: number }> _[line 66-122]_
- + `createHttpRelationships(classes: ClassInfo[], routeMap: Map<string, ClassInfo>)`: ClassRelationship[] _[line 127-171]_

---

**File:** `src/services/parsing/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/services/parsing/languages/AbstractParserStrategy.ts`

**Type:** abstract
**Abstract:** ✅

**Properties:**

- + `supportedExtensions`: string[] _[line 11]_

**Methods:**

- + `parseFile(filePath: string)`: ClassInfo[] _[line 16]_
- + `extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string)`: ClassRelationship[] _[line 21-25]_
- # `createClassId(classInfo: ClassInfo)`: string _[line 35-37]_
- # `createRelationshipsToTargets(fromInfo: ClassInfo, targetName: string, classMap: Map<string, ClassInfo[]>, type: ClassRelationship['type'], filter: (target: ClassInfo) => boolean)`: ClassRelationship[] _[line 62-78]_

---

**File:** `src/services/parsing/languages/HTMLParser.ts`


**Extends:** AbstractParserStrategy

**Properties:**

- + `supportedExtensions`: any _[line 22]_

**Methods:**

- + `parseFile(filePath: string)`: ClassInfo[] _[line 31-51]_
- + `extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string)`: ClassRelationship[] _[line 63-71]_
- + `parse(filePath: string, workspacePath: string)`: Promise<{ classes: ClassInfo[]; relationships: ClassRelationship[] }> _[async]_ _[line 77-87]_

---

**File:** `src/services/parsing/languages/HTTPParser.ts`


**Extends:** AbstractParserStrategy

**Properties:**

- + `supportedExtensions`: any _[line 21]_

**Methods:**

- + `parseFile(filePath: string)`: ClassInfo[] _[line 27-42]_
- + `extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string)`: ClassRelationship[] _[line 49-90]_
- - `extractDecoratorRoutes(sourceCode: string, filePath: string)`: ClassInfo[] _[line 96-127]_
- - `extractFileBasedRoutes(filePath: string)`: ClassInfo[] _[line 133-161]_
- - `filePathToRoutePath(filePath: string)`: string _[line 167-177]_
- - `buildRouteMap(classes: ClassInfo[])`: Map<string, ClassInfo> _[line 182-193]_
- - `extractHttpCalls(sourceCode: string, classInfo: ClassInfo, routeMap: Map<string, ClassInfo>)`: ClassRelationship[] _[line 198-248]_
- - `linkRoutesToHandlers(classes: ClassInfo[])`: ClassRelationship[] _[line 253-277]_

---

**File:** `src/services/parsing/languages/JavaParser.ts`


**Extends:** AbstractParserStrategy

**Properties:**

- + `supportedExtensions`: any _[line 7]_

**Methods:**

- + `parseFile(filePath: string)`: ClassInfo[] _[line 9-38]_
- - `removeComments(code: string)`: string _[line 40-46]_
- - `extractPackage(code: string)`: string _[line 48-51]_
- - `extractClasses(code: string, filePath: string, packageName: string)`: ClassInfo[] _[line 53-87]_
- - `extractInterfaces(code: string, filePath: string, packageName: string)`: ClassInfo[] _[line 89-119]_
- - `extractEnums(code: string, filePath: string, packageName: string)`: ClassInfo[] _[line 121-149]_
- - `extractClassBody(code: string, startIndex: number)`: string _[line 151-165]_
- - `extractFields(classBody: string, className: string)`: PropertyInfo[] _[line 167-208]_
- - `extractMethods(classBody: string, className: string)`: MethodInfo[] _[line 210-251]_
- - `parseParameters(paramsString: string)`: Array<{ name: string; type: string }> _[line 253-278]_
- - `smartSplit(str: string, delimiter: string)`: string[] _[line 280-307]_
- + `extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string)`: ClassRelationship[] _[line 309-503]_
- - `extractTypeName(typeStr: string)`: string _[line 505-520]_
- - `extractGenericTypes(typeStr: string)`: string[] _[line 522-538]_

---

**File:** `src/services/parsing/languages/JavaScriptParser.ts`


**Extends:** AbstractParserStrategy

**Properties:**

- + `supportedExtensions`: any _[line 10]_

**Methods:**

- + `parseFile(filePath: string)`: ClassInfo[] _[line 12-78]_
- + `extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string)`: ClassRelationship[] _[line 80-195]_
- - `extractMethodCallRelationships(classInfo: ClassInfo, allClassNames: Set<string>, classMap: Map<string, ClassInfo[]>)`: ClassRelationship[] _[line 197-349]_
- - `extractClassInfo(node: ts.ClassDeclaration, filePath: string, typeChecker: ts.TypeChecker)`: ClassInfo _[line 351-354]_
- - `extractClassExpressionInfo(name: string, node: ts.ClassExpression, filePath: string, typeChecker: ts.TypeChecker)`: ClassInfo _[line 356-363]_
- - `extractClassMembers(name: string, node: ts.ClassDeclaration | ts.ClassExpression, filePath: string, typeChecker: ts.TypeChecker)`: ClassInfo _[line 365-444]_
- - `extractConstructorProperties(node: ts.ConstructorDeclaration, sourceFile: ts.SourceFile, typeChecker: ts.TypeChecker)`: PropertyInfo[] _[line 446-500]_
- - `extractModuleInfo(sourceFile: ts.SourceFile, filePath: string)`: ClassInfo | null _[line 502-566]_
- - `extractTypeNames(typeString: string)`: string[] _[line 568-580]_
- - `getTypeFromJSDoc(node: ts.Node, typeChecker: ts.TypeChecker)`: string | undefined _[line 585-622]_
- - `getReturnTypeFromJSDoc(node: ts.MethodDeclaration, typeChecker: ts.TypeChecker)`: string | undefined _[line 627-646]_

---

**File:** `src/services/parsing/languages/PHPParser.ts`


**Extends:** AbstractParserStrategy

**Properties:**

- + `supportedExtensions`: any _[line 14]_
- - `parser`: any _[line 15]_

**Methods:**

- + `constructor()`: void _[line 17-28]_
- + `parseFile(filePath: string)`: ClassInfo[] _[line 30-85]_
- - `walkAST(node: any, callback: (node: any) => void)`: void _[line 87-107]_
- - `extractClassInfo(node: any, filePath: string)`: ClassInfo _[line 109-148]_
- - `extractInterfaceInfo(node: any, filePath: string)`: ClassInfo _[line 150-180]_
- - `extractTraitInfo(node: any, filePath: string)`: ClassInfo _[line 182-205]_
- - `extractProperties(node: any)`: PropertyInfo[] _[line 207-230]_
- - `extractMethod(node: any)`: MethodInfo _[line 232-258]_
- - `extractParameters(params: any[])`: Array<{ name: string; type: string; optional: boolean }> _[line 260-268]_
- - `getTypeName(typeNode: any)`: string _[line 270-301]_
- + `extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string)`: ClassRelationship[] _[line 303-493]_
- - `extractTypeNames(typeString: string)`: string[] _[line 495-531]_
- - `isCustomType(typeName: string)`: boolean _[line 533-542]_
- - `extractModuleFunctions(ast: any, classMethods: Set<string>)`: MethodInfo[] _[line 547-580]_

---

**File:** `src/services/parsing/languages/ParserFactory.ts`


**Properties:**

- - `parsers`: Map<string, AbstractParserStrategy> _[line 12]_
- - `httpParser`: HTTPParser _[line 13]_

**Methods:**

- + `constructor()`: void _[line 15-25]_
- - `register(parser: AbstractParserStrategy)`: void _[line 27-31]_
- + `getParser(filePath: string)`: AbstractParserStrategy | undefined _[line 33-36]_
- + `getHttpParser()`: HTTPParser _[line 42-44]_
- + `getSupportedExtensions()`: string[] _[line 46-48]_

---

**File:** `src/services/parsing/languages/PythonParser.ts`


**Extends:** AbstractParserStrategy

**Properties:**

- + `supportedExtensions`: any _[line 11]_

**Methods:**

- + `parseFile(filePath: string)`: ClassInfo[] _[line 13-178]_
- - `finishClass(classData: any, filePath: string, totalLines: number)`: ClassInfo _[line 180-225]_
- - `extractModuleFunctions(lines: string[])`: MethodInfo[] _[line 227-297]_
- + `extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string)`: ClassRelationship[] _[line 299-373]_
- - `extractTypeNames(typeString: string)`: string[] _[line 375-395]_

---

**File:** `src/services/parsing/languages/TypeScriptParser.ts`


**Extends:** AbstractParserStrategy

**Properties:**

- + `supportedExtensions`: any _[line 8]_

**Methods:**

- + `parseFile(filePath: string)`: ClassInfo[] _[line 10-72]_
- - `hasImportsOrExports(sourceFile: ts.SourceFile)`: boolean _[line 74-82]_
- + `extractRelationships(classes: ClassInfo[], allClassNames: Set<string>, workspacePath: string)`: ClassRelationship[] _[line 84-169]_
- - `extractAdvancedRelationships(sourceFile: ts.SourceFile, classInfo: ClassInfo, allClassNames: Set<string>, classMap: Map<string, ClassInfo[]>)`: ClassRelationship[] _[line 174-420]_
- - `extractModuleLevelInstantiations(filePath: string, allClassNames: Set<string>, workspacePath: string)`: Set<string> _[line 422-466]_
- - `extractImports(sourceFile: ts.SourceFile, currentFilePath: string, allClassNames: Set<string>, workspacePath: string)`: Set<string> _[line 471-511]_
- - `extractTypeNames(typeString: string)`: string[] _[line 513-525]_
- - `extractClassInfo(node: ts.ClassDeclaration, filePath: string)`: ClassInfo _[line 527-586]_
- - `extractInterfaceInfo(node: ts.InterfaceDeclaration, filePath: string)`: ClassInfo _[line 588-616]_
- - `extractProperty(node: ts.PropertyDeclaration)`: PropertyInfo _[line 618-629]_
- - `extractPropertySignature(node: ts.PropertySignature)`: PropertyInfo _[line 631-640]_
- - `extractMethod(node: ts.MethodDeclaration)`: MethodInfo _[line 642-658]_
- - `extractMethodSignature(node: ts.MethodSignature)`: MethodInfo _[line 660-674]_
- - `extractConstructor(node: ts.ConstructorDeclaration)`: MethodInfo _[line 676-690]_
- - `extractModuleInfo(sourceFile: ts.SourceFile, filePath: string)`: ClassInfo | null _[line 692-762]_
- - `getVisibility(node: ts.PropertyDeclaration | ts.MethodDeclaration)`: 'public' | 'private' | 'protected' _[line 764-768]_
- - `extractFunctionAsModule(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile, filePath: string)`: ClassInfo _[line 773-798]_
- - `extractArrowFunctionAsModule(declaration: ts.VariableDeclaration, statement: ts.VariableStatement, sourceFile: ts.SourceFile, filePath: string)`: ClassInfo _[line 803-835]_

---

**File:** `src/services/parsing/workspaceScanner.ts`


**Properties:**

- - `DEFAULT_EXCLUSIONS`: any _[static]_ _[readonly]_ _[line 6]_

**Methods:**

- + `scanFolders(workspacePath: string, selectedFolders: string[])`: ConfigFolderNode _[static]_ _[line 16-26]_
- - `buildFolderTree(workspacePath: string, relativePath: string, node: ConfigFolderNode, selectedFolders: string[])`: void _[static]_ _[line 28-65]_
- + `discoverExtensions(workspacePath: string)`: ExtensionInfo[] _[static]_ _[line 67-82]_
- - `scanExtensions(workspacePath: string, relativePath: string, extensionMap: Map<string, number>)`: void _[static]_ _[line 84-113]_

---

**File:** `src/services/telemetry/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/services/telemetry/telemetryService.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `telemetry`: {
		connectionString?: string;
	} _[line 6]_

---

**File:** `src/services/telemetry/telemetryService.ts`

**Type:** module
**Module:** ✅

**Methods:**

- + `loadConfig()`: ExtensionConfig _[line 11-21]_

---

**File:** `src/services/telemetry/telemetryService.ts`


**Methods:**

- + `initialize(connectionString: string)`: void _[static]_ _[line 30-38]_
- + `dispose()`: void _[static]_ _[line 40-43]_
- + `trackGenerateClassDiagram(classCount: number, folderCount: number, relationshipCount: number)`: void _[static]_ _[line 46-52]_
- + `trackShowGitChanges(changedFiles: number)`: void _[static]_ _[line 54-58]_
- + `trackOpenCommunity()`: void _[static]_ _[line 60-62]_
- + `trackOpenSettings()`: void _[static]_ _[line 64-66]_
- + `trackError(command: string, error: string)`: void _[static]_ _[line 68-70]_

---

**File:** `src/services/view/ViewManager.ts`


**Properties:**

- - `VIEWS_DIR`: any _[static]_ _[readonly]_ _[line 7]_
- - `REGISTRY_FILE`: any _[static]_ _[readonly]_ _[line 8]_

**Methods:**

- + `slugify(name: string)`: string _[static]_ _[line 14-21]_
- - `getViewsDir(workspacePath: string)`: string _[static]_ _[line 26-28]_
- - `getRegistryPath(workspacePath: string)`: string _[static]_ _[line 33-35]_
- - `getViewConfigPath(workspacePath: string, viewId: string)`: string _[static]_ _[line 40-42]_
- - `ensureViewsDir(workspacePath: string)`: void _[static]_ _[line 47-52]_
- - `loadRegistry(workspacePath: string)`: Promise<DiagramViewRegistry> _[static]_ _[async]_ _[line 57-71]_
- - `saveRegistry(workspacePath: string, registry: DiagramViewRegistry)`: Promise<void> _[static]_ _[async]_ _[line 76-80]_
- + `createView(workspacePath: string, name: string, config: KrataiConfig)`: Promise<DiagramView> _[static]_ _[async]_ _[line 85-112]_
- + `saveViewConfig(workspacePath: string, viewId: string, config: KrataiConfig)`: Promise<void> _[static]_ _[async]_ _[line 117-127]_
- + `loadViewConfig(workspacePath: string, viewId: string)`: Promise<KrataiConfig> _[static]_ _[async]_ _[line 132-145]_
- + `listViews(workspacePath: string)`: Promise<DiagramView[]> _[static]_ _[async]_ _[line 150-153]_
- + `getView(workspacePath: string, viewId: string)`: Promise<DiagramView | undefined> _[static]_ _[async]_ _[line 158-161]_
- + `updateLastGenerated(workspacePath: string, viewId: string)`: Promise<void> _[static]_ _[async]_ _[line 166-174]_
- + `updateView(workspacePath: string, viewId: string, updates: Partial<Pick<DiagramView, 'name'>>)`: Promise<string> _[static]_ _[async]_ _[line 180-212]_
- + `deleteView(workspacePath: string, viewId: string)`: Promise<void> _[static]_ _[async]_ _[line 217-229]_

---

**File:** `src/services/view/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/types/config/KrataiConfig.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `selectedFolders`: string[] _[line 2]_
- + `selectedExtensions`: string[] _[line 3]_
- + `respectGitignore`: boolean _[line 4]_
- + `followSymlinks`: boolean _[line 5]_
- + `classTypeFilters`: {            // Dynamic filters for class types
		[type: string]: boolean;    // e.g., { "class": true, "interface": false, "module": true }
	} _[line 6]_
- + `relationshipTypeFilters`: {     // Dynamic filters for relationship types
		[type: string]: boolean;    // e.g., { "extends": true, "implements": false, "calls": true }
	} _[line 9]_
- + `gitDiff`: {
		enabled?: boolean;          // Show git diff visualization
		baseCommit?: string;        // Compare against this commit (default: 'HEAD~1')
	} _[line 12]_
- + `detectHttpCalls`: boolean _[line 16]_
- + `frameworkEnrichment`: boolean _[line 17]_

---

**File:** `src/types/config/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/types/domain/ClassInfo.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `name`: string _[line 5]_
- + `filePath`: string _[line 6]_
- + `properties`: PropertyInfo[] _[line 7]_
- + `methods`: MethodInfo[] _[line 8]_
- + `extends`: string _[line 9]_
- + `implements`: string[] _[line 10]_
- + `isInterface`: boolean _[line 11]_
- + `isAbstract`: boolean _[line 12]_
- + `isModule`: boolean _[line 13]_
- + `classType`: | 'class' 
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
		| 'exception-handler' _[line 14]_
- + `changeStatus`: 'added' | 'deleted' | 'modified' | 'unchanged' _[line 39]_
- + `routeMeta`: {
		path: string;        // '/api/users/:id'
		method: string;      // 'GET', 'POST', '*' (any)
		definedIn?: string;  // Source file path
		pathVariables?: string[]; // ['id', 'postId']
	} _[line 42]_
- + `repositoryMeta`: {
		entityType?: string;  // 'User' from JpaRepository<User, Long>
		idType?: string;      // 'Long' from JpaRepository<User, Long>
	} _[line 50]_
- + `entityMeta`: {
		tableName?: string;   // From @Table(name = "users")
		primaryKey?: string;  // Field marked with @Id
	} _[line 56]_

---

**File:** `src/types/domain/ClassRelationship.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `from`: string _[line 2]_
- + `to`: string _[line 3]_
- + `type`: | 'extends' 
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
		| string[] _[line 5]_
- + `metadata`: {
		[key: string]: any;
	} _[line 54]_

---

**File:** `src/types/domain/DiagramData.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `classes`: ClassInfo[] _[line 5]_
- + `relationships`: ClassRelationship[] _[line 6]_

---

**File:** `src/types/domain/MethodInfo.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `name`: string _[line 4]_
- + `parameters`: ParameterInfo[] _[line 5]_
- + `returnType`: string _[line 6]_
- + `visibility`: 'public' | 'private' | 'protected' _[line 7]_
- + `isStatic`: boolean _[line 8]_
- + `isAsync`: boolean _[line 9]_
- + `changeStatus`: 'added' | 'deleted' | 'modified' | 'unchanged' _[line 10]_
- + `lineNumber`: number _[line 11]_
- + `endLineNumber`: number _[line 12]_
- + `hasInternalCalls`: boolean _[line 13]_

---

**File:** `src/types/domain/ParameterInfo.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `name`: string _[line 2]_
- + `type`: string _[line 3]_
- + `optional`: boolean _[line 4]_

---

**File:** `src/types/domain/PropertyInfo.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `name`: string _[line 2]_
- + `type`: string _[line 3]_
- + `visibility`: 'public' | 'private' | 'protected' _[line 4]_
- + `isStatic`: boolean _[line 5]_
- + `isReadonly`: boolean _[line 6]_
- + `changeStatus`: 'added' | 'deleted' | 'modified' | 'unchanged' _[line 7]_
- + `lineNumber`: number _[line 8]_
- + `endLineNumber`: number _[line 9]_

---

**File:** `src/types/domain/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/types/view/ConfigFolderNode.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `path`: string _[line 2]_
- + `name`: string _[line 3]_
- + `selected`: boolean _[line 4]_
- + `children`: ConfigFolderNode[] _[line 5]_
- + `fileCount`: number _[line 6]_

---

**File:** `src/types/view/DiagramView.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `id`: string _[line 4]_
- + `name`: string _[line 5]_
- + `config`: KrataiConfig _[line 6]_
- + `createdAt`: string _[line 7]_
- + `lastGenerated`: string _[line 8]_

---

**File:** `src/types/view/DiagramView.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `views`: DiagramView[] _[line 12]_

---

**File:** `src/types/view/ExtensionInfo.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `extension`: string _[line 2]_
- + `count`: number _[line 3]_
- + `selected`: boolean _[line 4]_

---

**File:** `src/types/view/ReactFlowEdge.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `id`: string _[line 2]_
- + `source`: string _[line 3]_
- + `target`: string _[line 4]_
- + `type`: string _[line 5]_
- + `label`: string _[line 6]_
- + `animated`: boolean _[line 7]_
- + `style`: Record<string, any> _[line 8]_

---

**File:** `src/types/view/ReactFlowNode.ts`

**Type:** interface
**Interface:** ✅

**Properties:**

- + `id`: string _[line 4]_
- + `type`: string _[line 5]_
- + `position`: { x: number; y: number } _[line 6]_
- + `data`: {
		label: string;
		classInfo: ClassInfo;
	} _[line 7]_

---

**File:** `src/types/view/index.ts`

**Type:** module
**Module:** ✅

---

**File:** `src/views/classDiagramView.ts`


**Methods:**

- + `generate(nodes: ReactFlowNode[], edges: ReactFlowEdge[], workspaceName: string, iconUri: string)`: string _[static]_ _[line 7-32]_
- - `generateHTML(workspaceName: string, classCount: number, edgeCount: number, folderCount: number, folderHTML: string, edges: ReactFlowEdge[], iconUri: string)`: string _[static]_ _[line 34-713]_

---

**File:** `src/views/components/classBoxRenderer.ts`


**Properties:**

- - `boxWidth`: number _[line 5]_

**Methods:**

- + `constructor(boxWidth: number)`: void _[line 5]_
- + `render(classInfo: ClassInfo, relationshipMap: Map<string, Array<{target: string, type: string}>>)`: string _[line 7-42]_
- - `escapeHtml(text: string)`: string _[line 44-57]_
- - `renderHeader(classInfo: ClassInfo, isModule: boolean, displayName: string)`: string _[line 59-77]_
- - `renderProperties(classInfo: ClassInfo, isModule: boolean)`: string _[line 79-118]_
- - `renderMethods(classInfo: ClassInfo, isModule: boolean)`: string _[line 120-158]_
- - `truncateType(type: string)`: string _[line 160-165]_
- - `truncateParams(parameters: any[])`: string _[line 167-171]_
- - `getVisibilityColor(visibility: 'public' | 'private' | 'protected')`: string _[line 173-176]_
- - `getVisibilitySymbol(visibility: 'public' | 'private' | 'protected')`: string _[line 178-181]_
- - `getChangeStatusBgColor(status: 'added' | 'deleted' | 'modified' | 'unchanged')`: string _[line 183-191]_
- - `getMemberChangeStatusBgColor(status: 'added' | 'deleted' | 'modified' | 'unchanged')`: string _[line 193-201]_

---

**File:** `src/views/components/folderBoxRenderer.ts`


**Methods:**

- + `renderAll(folder: DiagramFolderNode, depth: any)`: string _[line 6-13]_
- - `escapeHtml(text: string)`: string _[line 15-24]_
- - `renderFolder(folder: DiagramFolderNode, icon: string, totalCount: number, depth: number)`: string _[line 26-100]_
- - `getFolderIcon(folderName: string)`: string _[line 102-113]_

---

**File:** `src/views/components/relationshipRenderer.ts`


**Properties:**

- - `boxWidth`: number _[line 6]_
- - `boxHeight`: number _[line 7]_

**Methods:**

- + `constructor(boxWidth: number, boxHeight: number)`: void _[line 5-8]_
- + `renderAll(edges: ReactFlowEdge[], classPositions: Map<string, Position>)`: string _[line 10-12]_
- - `render(edge: ReactFlowEdge, classPositions: Map<string, Position>)`: string _[line 14-45]_
- - `calculateCurve(sourceX: number, sourceY: number, targetX: number, targetY: number)`: void _[line 47-58]_
- - `getEdgeColor(type: string)`: string _[line 60-67]_
- - `getDashArray(type: string)`: string _[line 69-75]_
- - `getMarkerEnd(type: string)`: string _[line 77-83]_
- + `renderMarkerDefs()`: string _[line 85-102]_

---

**File:** `src/views/gitChangesView.ts`


**Methods:**

- + `generate(result: GitComparisonResult, iconUri: string)`: string _[static]_ _[line 5-232]_

---

**File:** `src/views/krataiTreeProvider.ts`


**Extends:** vscode.TreeItem

**Properties:**

- + `label`: string _[readonly]_ _[line 8]_
- + `commandId`: string _[readonly]_ _[line 9]_
- + `iconName`: string _[readonly]_ _[line 10]_
- + `collapsibleState`: vscode.TreeItemCollapsibleState _[readonly]_ _[line 11]_
- + `contextValue`: string _[readonly]_ _[line 12]_
- + `viewId`: string _[readonly]_ _[line 13]_

**Methods:**

- + `constructor(label: string, commandId: string, iconName: string, collapsibleState: vscode.TreeItemCollapsibleState, contextValue: string, viewId: string)`: void _[line 7-26]_

---

**File:** `src/views/krataiTreeProvider.ts`


**Implements:** vscode.TreeDataProvider

**Properties:**

- - `_onDidChangeTreeData`: vscode.EventEmitter<KrataiTreeItem | undefined | null | void> _[line 30]_
- + `onDidChangeTreeData`: vscode.Event<KrataiTreeItem | undefined | null | void> _[readonly]_ _[line 32]_
- - `workspacePath`: string | undefined _[line 35]_

**Methods:**

- + `constructor()`: void _[line 37-53]_
- + `refresh()`: void _[line 55-57]_
- + `getTreeItem(element: KrataiTreeItem)`: vscode.TreeItem _[line 59-61]_
- + `getChildren(element: KrataiTreeItem)`: Promise<KrataiTreeItem[]> _[async]_ _[line 63-214]_

---

**File:** `route:///users`

**Type:** route

---

**File:** `route:///path`

**Type:** route

---

**File:** `route:///path`

**Type:** route

---

## 🔗 Relationships (644)

### calls (238)

- **src/commands/generateClassDiagram.ts__generateClassDiagram** → **src/commands/generateClassDiagram.ts__generateClassDiagramDirect** _(calls)_
- **src/commands/generateClassDiagram.ts__generateClassDiagram** → **src/commands/generateClassDiagram.ts__generateClassDiagramDirect** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/extension.ts__activate** → **src/commands/showGitChanges.ts__showGitChanges** _(calls)_
- **src/extension.ts__activate** → **src/commands/showGitChanges.ts__showGitChanges** _(calls)_
- **src/extension.ts__activate** → **src/commands/generateClassDiagram.ts__generateClassDiagram** _(calls)_
- **src/extension.ts__activate** → **src/commands/generateClassDiagram.ts__generateClassDiagram** _(calls)_
- **src/extension.ts__activate** → **src/commands/generateClassDiagram.ts__generateClassDiagramDirect** _(calls)_
- **src/extension.ts__activate** → **src/commands/generateClassDiagram.ts__generateClassDiagramDirect** _(calls)_
- **src/extension.ts__activate** → **src/commands/showConfigPanel.ts__showConfigPanel** _(calls)_
- **src/extension.ts__activate** → **src/commands/showConfigPanel.ts__showConfigPanel** _(calls)_
- **src/extension.ts__activate** → **src/commands/generateDiagramFromView.ts__generateDiagramFromView** _(calls)_
- **src/extension.ts__activate** → **src/commands/generateDiagramFromView.ts__generateDiagramFromView** _(calls)_
- **src/extension.ts__deactivate** → **src/commands/showGitChanges.ts__showGitChanges** _(calls)_
- **src/extension.ts__deactivate** → **src/commands/showGitChanges.ts__showGitChanges** _(calls)_
- **src/extension.ts__deactivate** → **src/commands/generateClassDiagram.ts__generateClassDiagram** _(calls)_
- **src/extension.ts__deactivate** → **src/commands/generateClassDiagram.ts__generateClassDiagram** _(calls)_
- **src/extension.ts__deactivate** → **src/commands/generateClassDiagram.ts__generateClassDiagramDirect** _(calls)_
- **src/extension.ts__deactivate** → **src/commands/generateClassDiagram.ts__generateClassDiagramDirect** _(calls)_
- **src/extension.ts__deactivate** → **src/commands/showConfigPanel.ts__showConfigPanel** _(calls)_
- **src/extension.ts__deactivate** → **src/commands/showConfigPanel.ts__showConfigPanel** _(calls)_
- **src/extension.ts__deactivate** → **src/commands/generateDiagramFromView.ts__generateDiagramFromView** _(calls)_
- **src/extension.ts__deactivate** → **src/commands/generateDiagramFromView.ts__generateDiagramFromView** _(calls)_
- **src/services/telemetry/telemetryService.ts__ExtensionConfig** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__ExtensionConfig** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__ExtensionConfig** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__TelemetryService** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__TelemetryService** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__TelemetryService** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/commands/generateClassDiagram.ts__generateClassDiagram** → **src/commands/generateClassDiagram.ts__generateClassDiagramDirect** _(calls)_
- **src/commands/generateClassDiagram.ts__generateClassDiagram** → **src/commands/generateClassDiagram.ts__generateClassDiagramDirect** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__ConfigPanelOptions** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__detectAvailableTypes** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeLabel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__getRelTypeDescription** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__showConfigPanel** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__generateConfigHTML** → **src/commands/showConfigPanel.ts__renderFolderTree** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__detectAvailableTypes** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__generateConfigHTML** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getRelTypeLabel** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/commands/showConfigPanel.ts__renderFolderTree** → **src/commands/showConfigPanel.ts__getRelTypeDescription** _(calls)_
- **src/services/telemetry/telemetryService.ts__ExtensionConfig** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__ExtensionConfig** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__ExtensionConfig** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__TelemetryService** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__TelemetryService** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__TelemetryService** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__ExtensionConfig** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__ExtensionConfig** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__ExtensionConfig** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__TelemetryService** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__TelemetryService** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_
- **src/services/telemetry/telemetryService.ts__TelemetryService** → **src/services/telemetry/telemetryService.ts__loadConfig** _(calls)_

### composition (249)

- **src/services/diagram/folderStructure.ts__DiagramFolderNode** → **src/types/view/ReactFlowNode.ts__ReactFlowNode** _(composition)_
- **src/services/diagram/folderStructure.ts__DiagramFolderNode** → **src/types/view/ReactFlowNode.ts__ReactFlowNode** _(composition)_
- **src/services/diagram/folderStructure.ts__DiagramFolderNode** → **src/types/view/ReactFlowNode.ts__ReactFlowNode** _(composition)_
- **src/services/diagram/layoutCalculator.ts__HierarchicalLayoutCalculator** → **src/services/diagram/layoutCalculator.ts__LayoutConfig** _(composition)_
- **src/services/diagram/layoutCalculator.ts__HierarchicalLayoutCalculator** → **src/services/diagram/layoutCalculator.ts__LayoutConfig** _(composition)_
- **src/services/diagram/layoutCalculator.ts__HierarchicalLayoutCalculator** → **src/services/diagram/layoutCalculator.ts__LayoutConfig** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/EnricherRegistry.ts__EnricherRegistry** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(composition)_
- **src/services/enrichment/EnricherRegistry.ts__EnricherRegistry** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(composition)_
- **src/services/enrichment/EnricherRegistry.ts__EnricherRegistry** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/git/contracts.ts__GitComparisonResult** → **src/services/git/contracts.ts__FileChange** _(composition)_
- **src/services/git/contracts.ts__GitComparisonResult** → **src/services/git/contracts.ts__FileChange** _(composition)_
- **src/services/git/contracts.ts__GitComparisonResult** → **src/services/git/contracts.ts__FileChange** _(composition)_
- **src/services/git/gitOperations.ts__GitDiffInfo** → **src/services/git/gitOperations.ts__FileChangeDetailed** _(composition)_
- **src/services/git/gitOperations.ts__GitDiffInfo** → **src/services/git/gitOperations.ts__FileChangeDetailed** _(composition)_
- **src/services/git/gitOperations.ts__GitDiffInfo** → **src/services/git/gitOperations.ts__FileChangeDetailed** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/PropertyInfo.ts__PropertyInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/PropertyInfo.ts__PropertyInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/PropertyInfo.ts__PropertyInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/MethodInfo.ts__MethodInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/MethodInfo.ts__MethodInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/MethodInfo.ts__MethodInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/types/domain/MethodInfo.ts__MethodInfo** → **src/types/domain/ParameterInfo.ts__ParameterInfo** _(composition)_
- **src/types/domain/MethodInfo.ts__MethodInfo** → **src/types/domain/ParameterInfo.ts__ParameterInfo** _(composition)_
- **src/types/domain/MethodInfo.ts__MethodInfo** → **src/types/domain/ParameterInfo.ts__ParameterInfo** _(composition)_
- **src/types/view/DiagramView.ts__DiagramView** → **src/types/config/KrataiConfig.ts__KrataiConfig** _(composition)_
- **src/types/view/DiagramView.ts__DiagramView** → **src/types/config/KrataiConfig.ts__KrataiConfig** _(composition)_
- **src/types/view/DiagramView.ts__DiagramView** → **src/types/config/KrataiConfig.ts__KrataiConfig** _(composition)_
- **src/types/view/DiagramView.ts__DiagramViewRegistry** → **src/types/view/DiagramView.ts__DiagramView** _(composition)_
- **src/types/view/DiagramView.ts__DiagramViewRegistry** → **src/types/view/DiagramView.ts__DiagramView** _(composition)_
- **src/types/view/DiagramView.ts__DiagramViewRegistry** → **src/types/view/DiagramView.ts__DiagramView** _(composition)_
- **src/types/view/ReactFlowNode.ts__ReactFlowNode** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/view/ReactFlowNode.ts__ReactFlowNode** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/view/ReactFlowNode.ts__ReactFlowNode** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/views/krataiTreeProvider.ts__KrataiTreeProvider** → **src/views/krataiTreeProvider.ts__KrataiTreeItem** _(composition)_
- **src/views/krataiTreeProvider.ts__KrataiTreeProvider** → **src/views/krataiTreeProvider.ts__KrataiTreeItem** _(composition)_
- **src/views/krataiTreeProvider.ts__KrataiTreeProvider** → **src/views/krataiTreeProvider.ts__KrataiTreeItem** _(composition)_
- **src/views/krataiTreeProvider.ts__KrataiTreeProvider** → **src/views/krataiTreeProvider.ts__KrataiTreeItem** _(composition)_
- **src/services/diagram/folderStructure.ts__DiagramFolderNode** → **src/types/view/ReactFlowNode.ts__ReactFlowNode** _(composition)_
- **src/services/diagram/folderStructure.ts__DiagramFolderNode** → **src/types/view/ReactFlowNode.ts__ReactFlowNode** _(composition)_
- **src/services/diagram/folderStructure.ts__DiagramFolderNode** → **src/types/view/ReactFlowNode.ts__ReactFlowNode** _(composition)_
- **src/services/diagram/layoutCalculator.ts__HierarchicalLayoutCalculator** → **src/services/diagram/layoutCalculator.ts__LayoutConfig** _(composition)_
- **src/services/diagram/layoutCalculator.ts__HierarchicalLayoutCalculator** → **src/services/diagram/layoutCalculator.ts__LayoutConfig** _(composition)_
- **src/services/diagram/layoutCalculator.ts__HierarchicalLayoutCalculator** → **src/services/diagram/layoutCalculator.ts__LayoutConfig** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/EnricherRegistry.ts__EnricherRegistry** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(composition)_
- **src/services/enrichment/EnricherRegistry.ts__EnricherRegistry** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(composition)_
- **src/services/enrichment/EnricherRegistry.ts__EnricherRegistry** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/git/contracts.ts__GitComparisonResult** → **src/services/git/contracts.ts__FileChange** _(composition)_
- **src/services/git/contracts.ts__GitComparisonResult** → **src/services/git/contracts.ts__FileChange** _(composition)_
- **src/services/git/contracts.ts__GitComparisonResult** → **src/services/git/contracts.ts__FileChange** _(composition)_
- **src/services/git/gitOperations.ts__GitDiffInfo** → **src/services/git/gitOperations.ts__FileChangeDetailed** _(composition)_
- **src/services/git/gitOperations.ts__GitDiffInfo** → **src/services/git/gitOperations.ts__FileChangeDetailed** _(composition)_
- **src/services/git/gitOperations.ts__GitDiffInfo** → **src/services/git/gitOperations.ts__FileChangeDetailed** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/diagram/folderStructure.ts__DiagramFolderNode** → **src/types/view/ReactFlowNode.ts__ReactFlowNode** _(composition)_
- **src/services/diagram/folderStructure.ts__DiagramFolderNode** → **src/types/view/ReactFlowNode.ts__ReactFlowNode** _(composition)_
- **src/services/diagram/folderStructure.ts__DiagramFolderNode** → **src/types/view/ReactFlowNode.ts__ReactFlowNode** _(composition)_
- **src/services/diagram/layoutCalculator.ts__HierarchicalLayoutCalculator** → **src/services/diagram/layoutCalculator.ts__LayoutConfig** _(composition)_
- **src/services/diagram/layoutCalculator.ts__HierarchicalLayoutCalculator** → **src/services/diagram/layoutCalculator.ts__LayoutConfig** _(composition)_
- **src/services/diagram/layoutCalculator.ts__HierarchicalLayoutCalculator** → **src/services/diagram/layoutCalculator.ts__LayoutConfig** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentContext** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/AbstractEnricher.ts__EnrichmentResult** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/services/enrichment/EnricherRegistry.ts__EnricherRegistry** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(composition)_
- **src/services/enrichment/EnricherRegistry.ts__EnricherRegistry** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(composition)_
- **src/services/enrichment/EnricherRegistry.ts__EnricherRegistry** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__UrlPattern** → **src/services/enrichment/frameworks/DjangoEnricher.ts__DynamicParam** _(composition)_
- **src/services/git/contracts.ts__GitComparisonResult** → **src/services/git/contracts.ts__FileChange** _(composition)_
- **src/services/git/contracts.ts__GitComparisonResult** → **src/services/git/contracts.ts__FileChange** _(composition)_
- **src/services/git/contracts.ts__GitComparisonResult** → **src/services/git/contracts.ts__FileChange** _(composition)_
- **src/services/git/gitOperations.ts__GitDiffInfo** → **src/services/git/gitOperations.ts__FileChangeDetailed** _(composition)_
- **src/services/git/gitOperations.ts__GitDiffInfo** → **src/services/git/gitOperations.ts__FileChangeDetailed** _(composition)_
- **src/services/git/gitOperations.ts__GitDiffInfo** → **src/services/git/gitOperations.ts__FileChangeDetailed** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/frameworks/FrameworkEnricherFactory.ts__FrameworkEnricherFactory** → **src/services/parsing/frameworks/IFrameworkEnricher.ts__IFrameworkEnricher** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/services/parsing/languages/ParserFactory.ts__ParserFactory** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/PropertyInfo.ts__PropertyInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/PropertyInfo.ts__PropertyInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/PropertyInfo.ts__PropertyInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/MethodInfo.ts__MethodInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/MethodInfo.ts__MethodInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/MethodInfo.ts__MethodInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/types/domain/MethodInfo.ts__MethodInfo** → **src/types/domain/ParameterInfo.ts__ParameterInfo** _(composition)_
- **src/types/domain/MethodInfo.ts__MethodInfo** → **src/types/domain/ParameterInfo.ts__ParameterInfo** _(composition)_
- **src/types/domain/MethodInfo.ts__MethodInfo** → **src/types/domain/ParameterInfo.ts__ParameterInfo** _(composition)_
- **src/types/view/DiagramView.ts__DiagramView** → **src/types/config/KrataiConfig.ts__KrataiConfig** _(composition)_
- **src/types/view/DiagramView.ts__DiagramView** → **src/types/config/KrataiConfig.ts__KrataiConfig** _(composition)_
- **src/types/view/DiagramView.ts__DiagramView** → **src/types/config/KrataiConfig.ts__KrataiConfig** _(composition)_
- **src/types/view/DiagramView.ts__DiagramViewRegistry** → **src/types/view/DiagramView.ts__DiagramView** _(composition)_
- **src/types/view/DiagramView.ts__DiagramViewRegistry** → **src/types/view/DiagramView.ts__DiagramView** _(composition)_
- **src/types/view/DiagramView.ts__DiagramViewRegistry** → **src/types/view/DiagramView.ts__DiagramView** _(composition)_
- **src/types/view/ReactFlowNode.ts__ReactFlowNode** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/view/ReactFlowNode.ts__ReactFlowNode** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/view/ReactFlowNode.ts__ReactFlowNode** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/PropertyInfo.ts__PropertyInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/PropertyInfo.ts__PropertyInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/PropertyInfo.ts__PropertyInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/MethodInfo.ts__MethodInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/MethodInfo.ts__MethodInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/types/domain/MethodInfo.ts__MethodInfo** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTTPParser.ts__HTTPParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/ClassInfo.ts__ClassInfo** → **src/services/parsing/languages/HTMLParser.ts__HTMLParser** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/types/domain/DiagramData.ts__DiagramData** → **src/types/domain/ClassRelationship.ts__ClassRelationship** _(composition)_
- **src/types/domain/MethodInfo.ts__MethodInfo** → **src/types/domain/ParameterInfo.ts__ParameterInfo** _(composition)_
- **src/types/domain/MethodInfo.ts__MethodInfo** → **src/types/domain/ParameterInfo.ts__ParameterInfo** _(composition)_
- **src/types/domain/MethodInfo.ts__MethodInfo** → **src/types/domain/ParameterInfo.ts__ParameterInfo** _(composition)_
- **src/types/view/DiagramView.ts__DiagramView** → **src/types/config/KrataiConfig.ts__KrataiConfig** _(composition)_
- **src/types/view/DiagramView.ts__DiagramView** → **src/types/config/KrataiConfig.ts__KrataiConfig** _(composition)_
- **src/types/view/DiagramView.ts__DiagramView** → **src/types/config/KrataiConfig.ts__KrataiConfig** _(composition)_
- **src/types/view/DiagramView.ts__DiagramViewRegistry** → **src/types/view/DiagramView.ts__DiagramView** _(composition)_
- **src/types/view/DiagramView.ts__DiagramViewRegistry** → **src/types/view/DiagramView.ts__DiagramView** _(composition)_
- **src/types/view/DiagramView.ts__DiagramViewRegistry** → **src/types/view/DiagramView.ts__DiagramView** _(composition)_
- **src/types/view/ReactFlowNode.ts__ReactFlowNode** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/view/ReactFlowNode.ts__ReactFlowNode** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/types/view/ReactFlowNode.ts__ReactFlowNode** → **src/types/domain/ClassInfo.ts__ClassInfo** _(composition)_
- **src/views/krataiTreeProvider.ts__KrataiTreeProvider** → **src/views/krataiTreeProvider.ts__KrataiTreeItem** _(composition)_
- **src/views/krataiTreeProvider.ts__KrataiTreeProvider** → **src/views/krataiTreeProvider.ts__KrataiTreeItem** _(composition)_
- **src/views/krataiTreeProvider.ts__KrataiTreeProvider** → **src/views/krataiTreeProvider.ts__KrataiTreeItem** _(composition)_
- **src/views/krataiTreeProvider.ts__KrataiTreeProvider** → **src/views/krataiTreeProvider.ts__KrataiTreeItem** _(composition)_

### implements (9)

- **src/services/diagram/layoutCalculator.ts__FolderSize** → **src/services/diagram/layoutCalculator.ts__Position** _(implements)_
- **src/services/diagram/layoutCalculator.ts__FolderSize** → **src/services/diagram/layoutCalculator.ts__Position** _(implements)_
- **src/services/diagram/layoutCalculator.ts__FolderSize** → **src/services/diagram/layoutCalculator.ts__Position** _(implements)_
- **src/services/diagram/layoutCalculator.ts__FolderSize** → **src/services/diagram/layoutCalculator.ts__Position** _(implements)_
- **src/services/diagram/layoutCalculator.ts__FolderSize** → **src/services/diagram/layoutCalculator.ts__Position** _(implements)_
- **src/services/diagram/layoutCalculator.ts__FolderSize** → **src/services/diagram/layoutCalculator.ts__Position** _(implements)_
- **src/services/diagram/layoutCalculator.ts__FolderSize** → **src/services/diagram/layoutCalculator.ts__Position** _(implements)_
- **src/services/diagram/layoutCalculator.ts__FolderSize** → **src/services/diagram/layoutCalculator.ts__Position** _(implements)_
- **src/services/diagram/layoutCalculator.ts__FolderSize** → **src/services/diagram/layoutCalculator.ts__Position** _(implements)_

### extends (148)

- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/DjangoEnricher.ts__DjangoEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/NextJSEnricher.ts__NextJSEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/enrichment/frameworks/SpringBootEnricher.ts__SpringBootEnricher** → **src/services/enrichment/AbstractEnricher.ts__AbstractEnricher** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTMLParser.ts__HTMLParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/HTTPParser.ts__HTTPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaParser.ts__JavaParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/JavaScriptParser.ts__JavaScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PHPParser.ts__PHPParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/PythonParser.ts__PythonParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_
- **src/services/parsing/languages/TypeScriptParser.ts__TypeScriptParser** → **src/services/parsing/languages/AbstractParserStrategy.ts__AbstractParserStrategy** _(extends)_

