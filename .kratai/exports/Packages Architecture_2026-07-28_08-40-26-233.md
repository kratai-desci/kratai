# Packages Architecture

Generated: 7/28/2026, 3:40:26 PM
Total: 508 classes, 155 relationships

---

## Project Structure

```
├── packages
│   ├── core
│   │   └── src
│   │       ├── diagram
│   │       │   ├── diagramGeneratorService.ts
│   │       │   ├── folderStructure.ts
│   │       │   └── index.ts
│   │       ├── enrichment
│   │       │   ├── AbstractEnricher.ts
│   │       │   ├── EnricherRegistry.ts
│   │       │   ├── frameworks
│   │       │   │   ├── DjangoEnricher.ts
│   │       │   │   ├── NextJSEnricher.ts
│   │       │   │   └── SpringBootEnricher.ts
│   │       │   └── index.ts
│   │       ├── export
│   │       │   └── MarkdownExporter.ts
│   │       ├── git
│   │       │   ├── contracts.ts
│   │       │   ├── gitDiffEnricher.ts
│   │       │   ├── gitOperations.ts
│   │       │   └── index.ts
│   │       ├── index.ts
│   │       ├── parsing
│   │       │   ├── codeParserService.ts
│   │       │   ├── frameworks
│   │       │   │   ├── FrameworkDetector.ts
│   │       │   │   ├── FrameworkEnricherFactory.ts
│   │       │   │   ├── IFrameworkEnricher.ts
│   │       │   │   └── index.ts
│   │       │   ├── httpCallDetector.ts
│   │       │   ├── index.ts
│   │       │   ├── languages
│   │       │   │   ├── AbstractParserStrategy.ts
│   │       │   │   ├── HTMLParser.ts
│   │       │   │   ├── HTTPParser.ts
│   │       │   │   ├── JavaParser.ts
│   │       │   │   ├── JavaScriptParser.ts
│   │       │   │   ├── PHPParser.ts
│   │       │   │   ├── ParserFactory.ts
│   │       │   │   ├── PythonParser.ts
│   │       │   │   └── TypeScriptParser.ts
│   │       │   └── workspaceScanner.ts
│   │       ├── telemetry
│   │       │   ├── index.ts
│   │       │   └── telemetryService.ts
│   │       ├── test
│   │       │   └── unit
│   │       │       ├── enrichment
│   │       │       │   ├── django
│   │       │       │   │   ├── django.test.ts
│   │       │       │   │   └── fixtures
│   │       │       │   │       ├── class-based-view.py
│   │       │       │   │       ├── function-based-view.py
│   │       │       │   │       ├── function-views.py
│   │       │       │   │       ├── middleware.py
│   │       │       │   │       ├── model-relationships.py
│   │       │       │   │       ├── permissions.py
│   │       │       │   │       ├── serializer-transform.py
│   │       │       │   │       └── views.py
│   │       │       │   ├── nextjs
│   │       │       │   │   ├── fixtures
│   │       │       │   │   │   ├── api-route.ts
│   │       │       │   │   │   ├── file-routing.ts
│   │       │       │   │   │   ├── form-component.tsx
│   │       │       │   │   │   ├── layout.tsx
│   │       │       │   │   │   ├── middleware.ts
│   │       │       │   │   │   ├── page-ssr.tsx
│   │       │       │   │   │   ├── page-with-api-calls.tsx
│   │       │       │   │   │   ├── page-with-components.tsx
│   │       │       │   │   │   ├── profile-page.tsx
│   │       │       │   │   │   └── server-actions.ts
│   │       │       │   │   └── nextjs.test.ts
│   │       │       │   └── springboot
│   │       │       │       ├── fixtures
│   │       │       │       │   ├── LayeredArchitecture.java
│   │       │       │       │   ├── Post.java
│   │       │       │       │   ├── User.java
│   │       │       │       │   ├── UserController.java
│   │       │       │       │   ├── UserService.java
│   │       │       │       │   ├── UserViewController.java
│   │       │       │       │   └── users
│   │       │       │       │       ├── form.jsp
│   │       │       │       │       ├── list.jsp
│   │       │       │       │       └── view.jsp
│   │       │       │       ├── springboot-jsp-linking.test.ts
│   │       │       │       └── springboot.test.ts
│   │       │       ├── http
│   │       │       │   ├── fixtures
│   │       │       │   │   ├── decorators.ts
│   │       │       │   │   ├── fetch-calls.ts
│   │       │       │   │   └── file-routing.ts
│   │       │       │   └── parser.test.ts
│   │       │       ├── languages
│   │       │       │   ├── html
│   │       │       │   │   ├── fixtures
│   │       │       │   │   │   ├── django-template.html
│   │       │       │   │   │   ├── nested
│   │       │       │   │   │   │   └── subfolder
│   │       │       │   │   │   │       └── deep.html
│   │       │       │   │   │   └── simple.html
│   │       │       │   │   └── parser.test.ts
│   │       │       │   ├── java
│   │       │       │   │   ├── fixtures
│   │       │       │   │   │   ├── AbstractClass.java
│   │       │       │   │   │   ├── Annotations.java
│   │       │       │   │   │   ├── ClassBased.java
│   │       │       │   │   │   ├── Enums.java
│   │       │       │   │   │   ├── FactoryPattern.java
│   │       │       │   │   │   ├── Generics.java
│   │       │       │   │   │   ├── InnerClasses.java
│   │       │       │   │   │   ├── InterfaceUsage.java
│   │       │       │   │   │   ├── Invalid.java
│   │       │       │   │   │   ├── Lambdas.java
│   │       │       │   │   │   ├── LocalVariableScoping.java
│   │       │       │   │   │   ├── ParentCalls.java
│   │       │       │   │   │   ├── StaticCalls.java
│   │       │       │   │   │   ├── Streams.java
│   │       │       │   │   │   ├── TypeRelationships.java
│   │       │       │   │   │   └── com
│   │       │       │   │   │       ├── acme
│   │       │       │   │   │       │   └── model
│   │       │       │   │   │       │       └── User.java
│   │       │       │   │   │       ├── company
│   │       │       │   │   │       │   └── app
│   │       │       │   │   │       │       └── module
│   │       │       │   │   │       │           └── feature
│   │       │       │   │   │       │               └── service
│   │       │       │   │   │       │                   └── impl
│   │       │       │   │   │       │                       └── DeepService.java
│   │       │       │   │   │       └── example
│   │       │       │   │   │           ├── base
│   │       │       │   │   │           │   └── BaseController.java
│   │       │       │   │   │           ├── controller
│   │       │       │   │   │           │   └── UserController.java
│   │       │       │   │   │           ├── dto
│   │       │       │   │   │           │   └── UserDTO.java
│   │       │       │   │   │           ├── factory
│   │       │       │   │   │           │   └── UserFactory.java
│   │       │       │   │   │           ├── interfaces
│   │       │       │   │   │           │   └── IUserService.java
│   │       │       │   │   │           ├── model
│   │       │       │   │   │           │   └── User.java
│   │       │       │   │   │           ├── repository
│   │       │       │   │   │           │   └── UserRepository.java
│   │       │       │   │   │           ├── service
│   │       │       │   │   │           │   └── UserService.java
│   │       │       │   │   │           └── util
│   │       │       │   │   │               └── ValidationUtils.java
│   │       │       │   │   └── parser.test.ts
│   │       │       │   ├── javascript
│   │       │       │   │   ├── fixtures
│   │       │       │   │   │   ├── async-chains.js
│   │       │       │   │   │   ├── class-based.js
│   │       │       │   │   │   ├── factory-pattern.js
│   │       │       │   │   │   ├── functional.js
│   │       │       │   │   │   ├── higher-order.js
│   │       │       │   │   │   ├── imports.js
│   │       │       │   │   │   ├── parent-calls.js
│   │       │       │   │   │   ├── re-exports.js
│   │       │       │   │   │   ├── static-calls.js
│   │       │       │   │   │   └── type-relationships.js
│   │       │       │   │   └── parser.test.ts
│   │       │       │   ├── php
│   │       │       │   │   ├── fixtures
│   │       │       │   │   │   ├── class-based.php
│   │       │       │   │   │   ├── factory-pattern.php
│   │       │       │   │   │   ├── functional.php
│   │       │       │   │   │   ├── higher-order.php
│   │       │       │   │   │   ├── namespaces.php
│   │       │       │   │   │   ├── parent-calls.php
│   │       │       │   │   │   ├── re-exports.php
│   │       │       │   │   │   ├── static-calls.php
│   │       │       │   │   │   ├── traits.php
│   │       │       │   │   │   └── type-declarations.php
│   │       │       │   │   └── parser.test.ts
│   │       │       │   ├── python
│   │       │       │   │   ├── fixtures
│   │       │       │   │   │   ├── async_chains.py
│   │       │       │   │   │   ├── class_based.py
│   │       │       │   │   │   ├── decorators.py
│   │       │       │   │   │   ├── factory_pattern.py
│   │       │       │   │   │   ├── functional.py
│   │       │       │   │   │   ├── higher_order.py
│   │       │       │   │   │   ├── imports.py
│   │       │       │   │   │   ├── local_variable_scoping.py
│   │       │       │   │   │   ├── parent_calls.py
│   │       │       │   │   │   ├── re_exports.py
│   │       │       │   │   │   ├── static_methods.py
│   │       │       │   │   │   └── type_hints.py
│   │       │       │   │   └── parser.test.ts
│   │       │       │   └── typescript
│   │       │       │       ├── fixtures
│   │       │       │       │   ├── async-chains.ts
│   │       │       │       │   ├── class-based.ts
│   │       │       │       │   ├── factory-pattern.ts
│   │       │       │       │   ├── functional.ts
│   │       │       │       │   ├── higher-order.ts
│   │       │       │       │   ├── imports.ts
│   │       │       │       │   ├── mixed-class-and-functions.ts
│   │       │       │       │   ├── parent-calls.ts
│   │       │       │       │   ├── re-exports.ts
│   │       │       │       │   ├── static-calls.ts
│   │       │       │       │   ├── type-relationships.ts
│   │       │       │       │   └── validator.ts
│   │       │       │       └── parser.test.ts
│   │       │       └── services
│   │       │           ├── folderStructure.test.ts
│   │       │           └── umlMapper.test.ts
│   │       ├── types
│   │       │   ├── config
│   │       │   │   ├── KrataiConfig.ts
│   │       │   │   └── index.ts
│   │       │   ├── domain
│   │       │   │   ├── ClassInfo.ts
│   │       │   │   ├── ClassRelationship.ts
│   │       │   │   ├── DiagramData.ts
│   │       │   │   ├── MethodInfo.ts
│   │       │   │   ├── ParameterInfo.ts
│   │       │   │   ├── PropertyInfo.ts
│   │       │   │   └── index.ts
│   │       │   └── view
│   │       │       ├── ConfigFolderNode.ts
│   │       │       ├── DiagramView.ts
│   │       │       ├── ExtensionInfo.ts
│   │       │       ├── ReactFlowEdge.ts
│   │       │       ├── ReactFlowNode.ts
│   │       │       └── index.ts
│   │       ├── util
│   │       │   ├── configService.ts
│   │       │   ├── index.ts
│   │       │   └── umlMapper.ts
│   │       └── view
│   │           ├── ViewManager.ts
│   │           └── index.ts
│   └── viewer
│       └── src
│           ├── classDiagramView.ts
│           ├── components
│           │   ├── classBoxRenderer.ts
│           │   └── folderBoxRenderer.ts
│           └── index.ts
└── route:
    └── 
        └── 
            ├── api
            │   ├── posts
            │   └── users
            │       └── :id
            ├── path
            └── users
```
---

## Classes (508)

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

EnrichmentContext (interface)
Properties:
- + workspacePath: string
- + classes: ClassInfo[]
- + relationships: ClassRelationship[]
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
---

AbstractEnricher (abstract)
Properties:
- + framework: string [readonly]
- + priority: number [readonly]
Methods:
- + detect(context: EnrichmentContext): boolean
- + enrich(context: EnrichmentContext): Promise<EnrichmentResult>
- + getFilePatterns(): string[]
Used By: DjangoEnricher (extends, imports), NextJSEnricher (extends, imports), SpringBootEnricher (extends, imports)
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
---

DynamicParam (interface)
Properties:
- + type: string
- + name: string
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
---

GitComparisonResult (interface)
Properties:
- + workspaceName: string
- + currentBranch: string
- + compareTarget: string
- + changes: FileChange[]
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
---

FileChangeDetailed (interface)
Properties:
- + filePath: string
- + status: 'added' | 'deleted' | 'modified'
- + addedLines: Set<number>
- + deletedLines: Set<number>
- + modifiedLines: Set<number>
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
---

IFrameworkEnricher (interface)
Properties:
- + name: string
Methods:
- + enrich(classes: ClassInfo[], workspacePath: string): void
- + extractRelationships(classes: ClassInfo[]): ClassRelationship[]
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
Used By: HTMLParser (extends, imports), HTTPParser (extends, imports), JavaParser (extends, imports), JavaScriptParser (extends, imports), PHPParser (extends, imports, calls-super), PythonParser (extends, imports), TypeScriptParser (extends, imports)
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
- - computeBraceDepths(code: string): Int32Array
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
- - extractAdvancedRelationships(sourceFile: ts.SourceFile, classInfo: ClassInfo, allClassNames: Set<string>, classMap: Map<string, ClassInfo[]>, methodOwnerMap: Map<string, ClassInfo[]>): ClassRelationship[]
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
---

loadConfig (module)
Methods:
- + loadConfig(): ExtensionConfig
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
---

DiagramData (interface)
Properties:
- + classes: ClassInfo[]
- + relationships: ClassRelationship[]
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
---

ParameterInfo (interface)
Properties:
- + name: string
- + type: string
- + optional: boolean
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
---

DiagramViewRegistry (interface)
Properties:
- + views: DiagramView[]
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
---

index (module)
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
---

index (module)
---

django.test (module)
---

nextjs.test (module)
---

springboot-jsp-linking.test (module)
---

springboot.test (module)
---

parser.test (module)
---

parser.test (module)
---

parser.test (module)
---

parser.test (module)
---

parser.test (module)
---

parser.test (module)
---

parser.test (module)
---

folderStructure.test (module)
---

umlMapper.test (module)
---

UserListView
Extends: LoginRequiredMixin
Methods:
- + get_queryset(): None
---

UserDetailView
Extends: DetailView
Methods:
- + get_context_data(kwargs: Any): None
---

UserCreateView
Extends: PermissionRequiredMixin
Methods:
- + form_valid(form: Any): None
---

PostListView
Extends: ListView
Methods:
- + get_queryset(): None
---

UserViewSet
Extends: viewsets.ModelViewSet
Properties:
- + Provides: list
Methods:
- + activate(request: Any, pk: Any): None
- + posts(request: Any, pk: Any): None
---

PostViewSet
Extends: viewsets.ModelViewSet
Methods:
- + get_queryset(): None
- + perform_create(serializer: Any): None
---

CategoryViewSet
Extends: viewsets.ReadOnlyModelViewSet
Methods:
- + posts(request: Any, slug: Any): None
---

[function-based-view] (module)
Methods:
- + delete_user(request: Any, user_id: Any): None
- + activate_user(request: Any, user_id: Any): None
- + create_post(request: Any): None
- + get_user_posts(request: Any, user_id: Any): None
- + list_posts_api(request: Any): None
- + post_detail_api(request: Any, pk: Any): None
- + add_comment(request: Any, post_id: Any): None
- + get_post_stats(request: Any, post_id: Any): None
---

[function-views] (module)
Methods:
- + task_list(request: Any): None
- + task_detail(request: Any, pk: Any): None
- + task_create(request: Any): None
- + task_edit(request: Any, pk: Any): None
- + task_delete(request: Any, pk: Any): None
---

CustomAuthenticationMiddleware
Extends: MiddlewareMixin
Methods:
- + process_request(request: Any): None
---

CORSMiddleware
Extends: MiddlewareMixin
Methods:
- + process_response(request: Any, response: Any): None
---

RequestLoggingMiddleware
Extends: MiddlewareMixin
Methods:
- + process_request(request: Any): None
- + process_response(request: Any, response: Any): None
---

RateLimitMiddleware
Extends: MiddlewareMixin
Methods:
- + process_request(request: Any): None
---

SecurityHeadersMiddleware
Extends: MiddlewareMixin
Methods:
- + process_response(request: Any, response: Any): None
---

User
Extends: AbstractUser
Methods:
- - __str__(): None
Used By: UserBuilder (uses), UserFactory (uses), [factory_pattern] (uses), UserRepository (uses), UserService (uses)
---

Profile
Extends: models.Model
Methods:
- - __str__(): None
---

Post
Extends: models.Model
---

Meta
---

Category
Extends: models.Model
Methods:
- - __str__(): None
---

Tag
Extends: models.Model
Methods:
- - __str__(): None
---

PostTag
Extends: models.Model
---

Comment
Extends: models.Model
Methods:
- - __str__(): None
---

IsOwnerOrReadOnly
Extends: permissions.BasePermission
Methods:
- + has_object_permission(request: Any, view: Any, obj: Any): None
---

IsAdminOrReadOnly
Extends: permissions.BasePermission
Methods:
- + has_permission(request: Any, view: Any): None
---

CanManageUsers
Extends: permissions.BasePermission
Methods:
- + has_permission(request: Any, view: Any): None
---

IsPostAuthor
Extends: permissions.BasePermission
Methods:
- + has_object_permission(request: Any, view: Any, obj: Any): None
---

UserSerializer
Extends: serializers.ModelSerializer
---

Meta
---

ProfileSerializer
Extends: serializers.ModelSerializer
---

PostSerializer
Extends: serializers.ModelSerializer
---

CategorySerializer
Extends: serializers.ModelSerializer
---

CommentSerializer
Extends: serializers.ModelSerializer
---

PostCreateSerializer
Extends: serializers.ModelSerializer
---

TaskListView
Extends: ListView
---

TaskDetailView
Extends: DetailView
---

TaskCreateView
Extends: CreateView
---

TaskUpdateView
Extends: UpdateView
---

TaskDeleteView
Extends: DeleteView
---

GET (module)
Methods:
- + GET(request: NextRequest, { params }: { params: { id: string } }): void [async]
---

PUT (module)
Methods:
- + PUT(request: NextRequest, { params }: { params: { id: string } }): void [async]
---

DELETE (module)
Methods:
- + DELETE(request: NextRequest, { params }: { params: { id: string } }): void [async]
---

GET (module)
Methods:
- + GET(request: NextRequest): void [async]
---

POST (module)
Methods:
- + POST(request: NextRequest): void [async]
---

fetchUsers (module)
Methods:
- + fetchUsers(): void [async]
---

createUser (module)
Methods:
- + createUser(data: any): void [async]
---

UserForm (module)
Methods:
- + UserForm(): void
---

DeleteButton (module)
Methods:
- + DeleteButton({ userId }: { userId: string }): void
---

SubmitButton (module)
Methods:
- + SubmitButton(): void
---

UsersLayout (module)
Methods:
- + UsersLayout({ children }: { children: ReactNode }): void
---

middleware (module)
Methods:
- + middleware(request: NextRequest): void
---

verifyAdminToken (module)
Methods:
- + verifyAdminToken(token: string): boolean
---

UsersPage (module)
Methods:
- + UsersPage(): void [async]
---

generateMetadata (module)
Methods:
- + generateMetadata({ params }: { params: { id: string } }): void [async]
---

Home (module)
Methods:
- + Home(): void
---

UsersPage (module)
Methods:
- + UsersPage(): void
---

ProfilePage (module)
Methods:
- + ProfilePage(): void
---

createUserAction (module)
Methods:
- + createUserAction(formData: FormData): void [async]
---

updateUserAction (module)
Methods:
- + updateUserAction(id: string, formData: FormData): void [async]
---

deleteUserAction (module)
Methods:
- + deleteUserAction(id: string): void [async]
---

ProductController (entity)
Properties:
- - productService: ProductService [readonly]
Methods:
- ~ ProductController(productService: ProductService): ProductController
- ~ getProduct(id: Long): ResponseEntity<ProductDTO>
- ~ createProduct(dto: ProductDTO): ResponseEntity<ProductDTO>
---

ProductService (entity)
Properties:
- - productRepository: ProductRepository [readonly]
Methods:
- ~ ProductService(productRepository: ProductRepository): ProductService
- ~ findById(id: Long): ProductDTO
- ~ toDTO(): return
- ~ create(dto: ProductDTO): ProductDTO
- ~ toDTO(): return
- ~ toDTO(product: Product): ProductDTO
- ~ toEntity(dto: ProductDTO): Product
---

Product (entity)
Properties:
- - id: Long
- - name: String
- - price: Double
Methods:
- ~ getId(): Long
- ~ setId(id: Long): void
- ~ getName(): String
- ~ setName(name: String): void
- ~ getPrice(): Double
- ~ setPrice(price: Double): void
---

ProductDTO (entity)
Properties:
- - id: Long
- - name: String
- - price: Double
Methods:
- ~ ProductDTO(id: Long, name: String, price: Double): ProductDTO
- ~ getId(): Long
- ~ getName(): String
- ~ getPrice(): Double
---

ProductNotFoundException (entity)
Extends: RuntimeException
Methods:
- ~ ProductNotFoundException(id: Long): ProductNotFoundException
- ~ super(): void
---

Post (entity)
Properties:
- - id: Long
- - title: String
- - content: String
- - user: User
Methods:
- ~ Post(): Post
- ~ Post(title: String, content: String): Post
- ~ getId(): Long
- ~ setId(id: Long): void
- ~ getTitle(): String
- ~ setTitle(title: String): void
- ~ getContent(): String
- ~ setContent(content: String): void
- ~ getUser(): User
- ~ setUser(user: User): void
---

User (entity)
Properties:
- - id: Long
- ~ length: false,
- ~ nullable: true,
- - active: boolean
- ~ updatable: false,
- - updatedAt: LocalDateTime
- - posts: List<Post>
- ~ name: 
- - profile: Profile
Methods:
- ~ User(): User
- ~ User(name: String, email: String): User
- ~ onCreate(): void
- ~ onUpdate(): void
- ~ getId(): Long
- ~ setId(id: Long): void
- ~ getName(): String
- ~ setName(name: String): void
- ~ getEmail(): String
- ~ setEmail(email: String): void
- ~ isActive(): boolean
- ~ setActive(active: boolean): void
- ~ getCreatedAt(): LocalDateTime
- ~ getUpdatedAt(): LocalDateTime
- ~ getPosts(): List<Post>
- ~ setPosts(posts: List<Post>): void
- ~ addPost(post: Post): void
- ~ removePost(post: Post): void
- ~ getRoles(): Set<Role>
- ~ setRoles(roles: Set<Role>): void
- ~ getProfile(): Profile
- ~ setProfile(profile: Profile): void
- ~ if(): void
---

GET /api/users/:id (route)
---

GET /api/users/:id/posts (route)
---

PUT /api/users/:id (route)
---

DELETE /api/users/:id (route)
---

PATCH /api/users/:id (route)
---

GET /api/users (route)
---

POST /api/users (route)
---

DELETE /api/users (route)
---

UserController (rest-controller)
Properties:
- - userService: UserService [readonly]
Methods:
- ~ UserController(userService: UserService): UserController
- ~ getUser(id: Long): ResponseEntity<UserDTO>
- ~ createUser(dto: UserDTO): ResponseEntity<UserDTO>
- ~ updateUser(id: Long, dto: UserDTO): ResponseEntity<UserDTO>
- ~ deleteUser(id: Long): ResponseEntity<Void>
- ~ patchUser(id: Long, dto: UserDTO): ResponseEntity<UserDTO>
- ~ getUserPosts(id: Long): ResponseEntity<List<PostDTO>>
---

UserService (service)
Properties:
- - userRepository: UserRepository [readonly]
Methods:
- ~ UserService(userRepository: UserRepository): UserService
- ~ findAll(name: String, page: int): List<UserDTO>
- ~ findById(id: Long): UserDTO
- ~ toDTO(): return
- ~ create(dto: UserDTO): UserDTO
- ~ toDTO(): return
- ~ update(id: Long, dto: UserDTO): UserDTO
- ~ toDTO(): return
- ~ delete(id: Long): void
- ~ UserNotFoundException(): throw new
- ~ patch(id: Long, dto: UserDTO): UserDTO
- ~ toDTO(): return
- ~ getUserPosts(id: Long): List<PostDTO>
- ~ toDTO(user: User): UserDTO
- ~ toEntity(dto: UserDTO): User
Used By: ExtendedUserService (extends, calls-super)
---

GET /users/:id (route)
---

GET /users/new (route)
---

GET /users (route)
---

UserViewController (controller)
Properties:
- - userService: UserService [readonly]
Methods:
- ~ UserViewController(userService: UserService): UserViewController
- ~ listUsers(model: Model): String
- ~ viewUser(id: Long): ModelAndView
- ~ newUserForm(): ModelAndView
- ~ ModelAndView(): return new
---

form.jsp (template)
---

list.jsp (template)
---

view.jsp (template)
---

Get (module)
Methods:
- + Get(path: string): any
---

Post (module)
Methods:
- + Post(path: string): any
---

Put (module)
Methods:
- + Put(path: string): any
---

Delete (module)
Methods:
- + Delete(path: string): any
---

Patch (module)
Methods:
- + Patch(path: string): any
---

UserController
Methods:
- + getUsers(): Promise<any[]> [async]
- + getUserById(id: string): Promise<any> [async]
- + createUser(data: any): Promise<any> [async]
- + updateUser(id: string, data: any): Promise<any> [async]
- + deleteUser(id: string): Promise<any> [async]
- + patchUser(id: string, data: any): Promise<any> [async]
---

PostController
Methods:
- + getPosts(): Promise<any[]> [async]
- + createPost(data: any): Promise<any> [async]
---

decorator (module)
Methods:
- + decorator(target: any): void
---

UserService
Methods:
- + getUsers(): void [async]
- + getUserById(id: string): void [async]
- + createUser(data: any): void [async]
- + updateUser(id: string, data: any): void [async]
- + deleteUser(id: string): void [async]
- + fetchExternal(): void [async]
Used By: AdminService (extends, calls-super)
---

PostService
Methods:
- + getPosts(): void [async]
- + createPost(data: any): void [async]
- + updatePost(id: string, data: any): void [async]
- + deletePost(id: string): void [async]
- + patchPost(id: string, data: any): void [async]
---

UserList (module)
Methods:
- + UserList(): void
---

GET (module)
Methods:
- + GET(request: Request): void [async]
---

POST (module)
Methods:
- + POST(request: Request): void [async]
---

DELETE (module)
Methods:
- + DELETE(request: Request): void [async]
---

helper (module)
Methods:
- + helper(): void
---

django-template.html (template)
---

deep.html (template)
---

simple.html (template)
---

AbstractBaseService (abstract)
Properties:
- # serviceName: String
- # initialized: boolean
Methods:
- ~ AbstractBaseService(serviceName: String): AbstractBaseService
- ~ initialize(): void
- ~ cleanup(): void
- ~ execute(): void
- ~ if(): void
- ~ initialize(): void
- ~ doExecute(): void
- ~ cleanup(): void
- ~ doExecute(): void
- ~ log(message: String): void
Used By: ConcreteService (extends, calls-super)
---

ConcreteService
Extends: AbstractBaseService
Properties:
- - connection: DatabaseConnection
Methods:
- ~ ConcreteService(): ConcreteService
- ~ super(): void
- ~ initialize(): void
- ~ log(): void
- ~ cleanup(): void
- ~ log(): void
- ~ if(): void
- ~ doExecute(): void
- ~ log(): void
Uses: AbstractBaseService (extends, calls-super)
---

UserRepository
Extends: AbstractRepository<User, Long>
Properties:
- - connection: DatabaseConnection
- ~ id: FROM users WHERE
- ~ id: FROM users WHERE
Methods:
- ~ findById(id: Long): User
- ~ findAll(): List<User>
- ~ save(entity: User): User
- ~ delete(id: Long): void
---

UserController (entity)
Properties:
- - userService: UserService
Methods:
- ~ getAllUsers(): List<User>
- ~ getUserById(id: Long): User
- ~ createUser(dto: UserDTO): User
- ~ updateUser(id: Long, dto: UserDTO): User
- ~ deleteUser(id: Long): void
---

UserService (entity)
Properties:
- - repository: UserRepository
- - emailService: EmailService
Methods:
- ~ findAll(): List<User>
- ~ findById(id: Long): User
- ~ create(dto: UserDTO): User
- ~ update(id: Long, dto: UserDTO): User
- ~ delete(id: Long): void
Used By: ExtendedUserService (extends, calls-super)
---

User (entity)
Properties:
- - id: Long
- ~ length: false,
- ~ unique: false,
- - age: Integer
- - posts: List<Post>
- - department: Department
Methods:
- ~ getId(): Long
- ~ getName(): String
- ~ setName(name: String): void
- ~ getEmail(): String
- ~ setEmail(email: String): void
- ~ toString(): String
---

UserDTO (entity)
Properties:
- ~ max: 2,
- - email: String
- - age: Integer
Methods:
- ~ getName(): String
- ~ getEmail(): String
- ~ getAge(): Integer
---

Post (entity)
Properties:
- - id: Long
- - title: String
- - user: User
---

Department (entity)
Properties:
- - id: Long
- - name: String
- - users: List<User>
---

EmailService (entity)
Methods:
- ~ sendWelcome(user: User): void
---

AuditedService (entity)
Methods:
- ~ createUser(user: User): void
- ~ deleteUser(id: Long): void
---

Audited (entity)
---

BaseService (abstract)
Properties:
- # serviceName: String
Methods:
- ~ initialize(): void
- ~ log(message: String): void
Used By: UserService (extends), UserService (extends, calls-super), AdminService (extends, calls-super), ConfigurableService (extends, calls-super), DetailedService (extends, calls-super), ConstructorTest (extends, calls-super)
---

UserService
Extends: BaseService
Properties:
- - repository: UserRepository
- - maxRetries: int
- + description: String
Methods:
- ~ UserService(repository: UserRepository): UserService
- ~ initialize(): void
- ~ log(): void
- ~ findById(id: Long): User
- ~ findAll(): List<User>
- ~ save(user: User): User
- ~ validate(): void
- ~ validate(user: User): void
- ~ IllegalArgumentException(): throw new
Uses: BaseService (extends), BaseService (extends)
Used By: ExtendedUserService (extends, calls-super)
---

UserRepository
Properties:
- - connection: DatabaseConnection
- ~ id: FROM users WHERE
Methods:
- ~ findById(id: Long): User
- ~ findAll(): List<User>
- ~ save(user: User): User
---

User
Properties:
- - id: Long
- - name: String
- - email: String
Methods:
- ~ User(id: Long, name: String, email: String): User
- ~ getId(): Long
- ~ getName(): String
- ~ setName(name: String): void
- ~ getEmail(): String
- ~ setEmail(email: String): void
---

DatabaseConnection
Properties:
- - connectionString: String
Methods:
- ~ query(sql: String): <T> T
- ~ insert(entity: T): <T> T
---

UserService
Methods:
- ~ createUser(name: String, role: UserRole): User
- ~ canModerate(user: User): boolean
- ~ activateUser(user: User): void
Used By: ExtendedUserService (extends, calls-super)
---

Calculator
Methods:
- ~ calculate(x: double, y: double, operation: Operation): double
- ~ add(x: double, y: double): double
- ~ subtract(x: double, y: double): double
---

HttpResponse
Properties:
- - status: HttpStatus
- - body: String
Methods:
- ~ HttpResponse(status: HttpStatus, body: String): HttpResponse
- ~ isSuccessful(): boolean
- ~ getStatusCode(): int
---

User
Properties:
- - name: String
- - role: UserRole
- - status: Status
Methods:
- ~ setName(name: String): void
- ~ setRole(role: UserRole): void
- ~ setStatus(status: Status): void
- ~ getRole(): UserRole
- ~ getStatus(): Status
---

Status (enum)
---

UserRole (enum)
Properties:
- - displayName: String [readonly]
- - priority: int [readonly]
Methods:
- ~ GUEST(): void
- ~ UserRole(displayName: String, priority: int): UserRole
- ~ getDisplayName(): String
- ~ getPriority(): int
- ~ hasHigherPriorityThan(other: UserRole): boolean
---

Operation (enum)
Methods:
- ~ apply(x: double, y: double): double
- ~ apply(x: double, y: double): double
- ~ apply(x: double, y: double): double
- ~ apply(x: double, y: double): double
- ~ if(): void
- ~ ArithmeticException(): throw new
- ~ apply(x: double, y: double): double
---

HttpStatus (enum)
Properties:
- - code: int [readonly]
- - message: String [readonly]
Methods:
- ~ INTERNAL_SERVER_ERROR(): void
- ~ HttpStatus(code: int, message: String): HttpStatus
- ~ getCode(): int
- ~ getMessage(): String
- ~ isSuccess(): boolean
- ~ isError(): boolean
- ~ fromCode(code: int): HttpStatus
- ~ if(): void
- ~ IllegalArgumentException(): throw new
---

UserFactory
Methods:
- ~ createUser(name: String, email: String): User
- ~ User(): return new
- ~ createAdmin(name: String, email: String): User
- ~ createGuest(): User
- ~ User(): return new
---

NotificationFactory (abstract)
Methods:
- ~ createNotification(): Notification
- ~ sendNotification(message: String): void
Used By: EmailNotificationFactory (extends), SMSNotificationFactory (extends)
---

EmailNotificationFactory
Extends: NotificationFactory
Methods:
- ~ createNotification(): Notification
- ~ EmailNotification(): return new
Uses: NotificationFactory (extends)
---

SMSNotificationFactory
Extends: NotificationFactory
Methods:
- ~ createNotification(): Notification
- ~ SMSNotification(): return new
Uses: NotificationFactory (extends)
---

DarkThemeFactory
Implements: UIFactory
Methods:
- ~ createButton(): Button
- ~ DarkButton(): return new
- ~ createTextField(): TextField
- ~ DarkTextField(): return new
Uses: UIFactory (implements)
---

LightThemeFactory
Implements: UIFactory
Methods:
- ~ createButton(): Button
- ~ LightButton(): return new
- ~ createTextField(): TextField
- ~ LightTextField(): return new
Uses: UIFactory (implements)
---

UserBuilder
Properties:
- - name: String
- - email: String
- - age: int
- - role: String
Methods:
- ~ setName(name: String): UserBuilder
- ~ setEmail(email: String): UserBuilder
- ~ setAge(age: int): UserBuilder
- ~ setRole(role: String): UserBuilder
- ~ build(): User
---

UserService
Properties:
- - userFactory: UserFactory
- - notificationFactory: EmailNotificationFactory
Methods:
- ~ UserService(): UserService
- ~ registerUser(name: String, email: String): User
- ~ createAdminUser(name: String, email: String): User
Used By: ExtendedUserService (extends, calls-super)
---

DatabaseConnection
Properties:
- - instance: DatabaseConnection [static]
Methods:
- ~ DatabaseConnection(): DatabaseConnection
- ~ getInstance(): DatabaseConnection
- ~ if(): void
---

RegistrationService
Methods:
- ~ registerWithBuilder(name: String, email: String, age: int): User
---

User
Properties:
- - name: String
- - email: String
- - age: int
- - role: String
Methods:
- ~ User(name: String, email: String): User
- ~ setAge(age: int): void
- ~ setRole(role: String): void
---

EmailNotification
Implements: Notification
Methods:
- ~ send(message: String): void
Uses: Notification (implements)
---

SMSNotification
Implements: Notification
Methods:
- ~ send(message: String): void
Uses: Notification (implements)
---

DarkButton
Implements: Button
Methods:
- ~ render(): void
Uses: Button (implements)
---

LightButton
Implements: Button
Methods:
- ~ render(): void
Uses: Button (implements)
---

DarkTextField
Implements: TextField
Methods:
- ~ render(): void
Uses: TextField (implements)
---

LightTextField
Implements: TextField
Methods:
- ~ render(): void
Uses: TextField (implements)
---

UIFactory (interface)
Methods:
- ~ createButton(): Button
- ~ createTextField(): TextField
Used By: DarkThemeFactory (implements), LightThemeFactory (implements)
---

Notification (interface)
Methods:
- ~ send(message: String): void
Used By: EmailNotification (implements), SMSNotification (implements)
---

Button (interface)
Methods:
- ~ render(): void
Used By: DarkButton (implements), LightButton (implements)
---

TextField (interface)
Methods:
- ~ render(): void
Used By: DarkTextField (implements), LightTextField (implements)
---

UserRepository
Extends: BaseRepository<User, Long>
Methods:
- ~ findById(id: Long): User
- ~ delete(id: Long): void
- ~ findByName(name: String): List<User>
- ~ for(): void
---

UserService
Properties:
- - repository: Repository<User, Long>
Methods:
- ~ UserService(repository: Repository<User, Long>): UserService
- ~ getAllUsers(): List<User>
- ~ getUser(id: Long): User
- ~ createUser(user: User): User
Used By: ExtendedUserService (extends, calls-super)
---

GenericMethods
Methods:
- ~ toList(): <T> List<T>
- ~ for(): void
- ~ max(a: T, b: T): <T extends Comparable<T>> T
- ~ makePair(key: K, value: V): <K, V> Pair<K, V>
---

User
Properties:
- - id: Long
- - name: String
Methods:
- ~ User(id: Long, name: String): User
- ~ getId(): Long
- ~ getName(): String
---

OuterClass
Properties:
- - outerField: String
Methods:
- ~ OuterClass(outerField: String): OuterClass
- ~ InnerClass(innerField: String): public
- ~ display(): void
- ~ getOuterField(): String
- ~ StaticNestedClass(nestedField: String): public
- ~ display(): void
- ~ methodWithLocalClass(): void
- ~ display(): void
- ~ createRunnable(): Runnable
- ~ Runnable(): return new
- ~ run(): void
---

InnerClass
Properties:
- - innerField: String
Methods:
- ~ InnerClass(innerField: String): InnerClass
- ~ display(): void
- ~ getOuterField(): String
---

StaticNestedClass
Properties:
- - nestedField: String
Methods:
- ~ StaticNestedClass(nestedField: String): StaticNestedClass
- ~ display(): void
---

LocalInnerClass
Methods:
- ~ display(): void
---

UserService
Properties:
- - serviceName: String
Methods:
- ~ UserService(serviceName: String): UserService
- ~ validate(user: User): boolean
- ~ setName(name: String): UserBuilder
- ~ setEmail(email: String): UserBuilder
- ~ build(): User
- ~ User(): return new
- ~ createUser(name: String, email: String): User
- ~ IllegalArgumentException(): throw new
- ~ createUserWithBuilder(name: String, email: String): User
Used By: ExtendedUserService (extends, calls-super)
---

UserValidator
Methods:
- ~ validate(user: User): boolean
---

UserBuilder
Properties:
- - name: String
- - email: String
Methods:
- ~ setName(name: String): UserBuilder
- ~ setEmail(email: String): UserBuilder
- ~ build(): User
- ~ User(): return new
---

UserRepository
Methods:
- ~ from(table: String): QueryBuilder
- ~ where(condition: String): QueryBuilder
- ~ build(): String
- ~ mapRow(rs: ResultSet): User
- ~ findUsers(condition: String): List<User>
---

QueryBuilder
Properties:
- - table: String
- - whereClause: String
Methods:
- ~ from(table: String): QueryBuilder
- ~ where(condition: String): QueryBuilder
- ~ build(): String
---

ResultMapper
Methods:
- ~ mapRow(rs: ResultSet): User
---

ApplicationConfig
Properties:
- - databaseConfig: DatabaseConfig
- - cacheConfig: CacheConfig
Methods:
- ~ DatabaseConfig(url: String, username: String, password: String): public
- ~ getUrl(): String
- ~ CacheConfig(maxSize: int, ttl: int): public
- ~ getMaxSize(): int
- ~ configure(): void
---

DatabaseConfig
Properties:
- - url: String
- - username: String
- - password: String
Methods:
- ~ DatabaseConfig(url: String, username: String, password: String): DatabaseConfig
- ~ getUrl(): String
---

CacheConfig
Properties:
- - maxSize: int
- - ttl: int
Methods:
- ~ CacheConfig(maxSize: int, ttl: int): CacheConfig
- ~ getMaxSize(): int
---

User
Properties:
- - name: String
- - email: String
Methods:
- ~ User(name: String, email: String): User
- ~ getName(): String
- ~ getEmail(): String
---

ResultSet
Methods:
- ~ getString(column: String): String
---

UserServiceImpl
Implements: IUserService
Properties:
- - repository: UserRepository
Methods:
- ~ UserServiceImpl(repository: UserRepository): UserServiceImpl
- ~ findById(id: Long): User
- ~ findAll(): List<User>
- ~ save(user: User): User
- ~ delete(id: Long): void
Uses: IUserService (implements), IUserService (implements)
---

AuditableUser
Implements: IAuditable, ISerializable
Properties:
- - createdAt: LocalDateTime
- - updatedAt: LocalDateTime
- - name: String
Methods:
- ~ setCreatedAt(timestamp: LocalDateTime): void
- ~ setUpdatedAt(timestamp: LocalDateTime): void
- ~ serialize(): String
Uses: IAuditable (implements), ISerializable (implements)
---

MultiImpl
Implements: IUserService, IAuditable
Properties:
- - repository: UserRepository
- - createdAt: LocalDateTime
- - updatedAt: LocalDateTime
Methods:
- ~ findById(id: Long): User
- ~ findAll(): List<User>
- ~ save(user: User): User
- ~ delete(id: Long): void
- ~ setCreatedAt(timestamp: LocalDateTime): void
- ~ setUpdatedAt(timestamp: LocalDateTime): void
Uses: IUserService (implements), IUserService (implements), IAuditable (implements)
---

IUserService (interface)
Methods:
- ~ findById(id: Long): User
- ~ findAll(): List<User>
- ~ save(user: User): User
- ~ delete(id: Long): void
Used By: UserServiceImpl (implements), MultiImpl (implements), UserService (implements, imports)
---

IAuditable (interface)
Methods:
- ~ setCreatedAt(timestamp: LocalDateTime): void
- ~ setUpdatedAt(timestamp: LocalDateTime): void
Used By: AuditableUser (implements), MultiImpl (implements)
---

ISerializable (interface)
Methods:
- ~ serialize(): String
Used By: AuditableUser (implements)
---

InvalidSyntax
Methods:
- ~ method(): String name
    
    
    public void
---

UserService
Properties:
- - users: List<User>
Methods:
- ~ processUsers(processor: UserProcessor): void
- ~ processWithLambda(): void
- ~ filterUsers(validator: UserValidator): List<User>
- ~ filterActive(): List<User>
- ~ updateUsers(updater: Consumer<User>): void
- ~ activateAllUsers(): void
- ~ getUserNames(): List<String>
- ~ getEmailsMethodRef(): List<String>
Used By: ExtendedUserService (extends, calls-super)
---

DataProcessor
Methods:
- ~ transform(items: List<T>, transformer: Transformer<T, R>): <T, R> List<R>
- ~ processUsers(users: List<User>): List<User>
- ~ executeWithCallback(callback: Runnable): void
- ~ processWithLambda(): void
- ~ createFormatter(): Function<User, String>
- ~ createAgePredicate(minAge: int): Predicate<User>
---

Calculator
Methods:
- ~ apply(a: double, b: double): double
- ~ calculate(a: double, b: double, operation: Operation): double
- ~ performCalculations(): void
---

EventManager
Properties:
- - handlers: List<Consumer<Event>>
Methods:
- ~ subscribe(handler: Consumer<Event>): void
- ~ emit(event: Event): void
- ~ setupHandlers(): void
- ~ subscribe(): void
- ~ handleEvent(event: Event): void
---

UserSorter
Methods:
- ~ sortByName(users: List<User>): List<User>
- ~ sortByAge(users: List<User>): List<User>
- ~ sortByMultiple(users: List<User>): List<User>
---

User
Properties:
- - name: String
- - email: String
- - age: int
- - active: boolean
- - verified: boolean
Methods:
- ~ getName(): String
- ~ getEmail(): String
- ~ getAge(): int
- ~ isActive(): boolean
- ~ setActive(active: boolean): void
- ~ setVerified(verified: boolean): void
- ~ activate(): void
---

Event
Properties:
- - name: String
Methods:
- ~ getName(): String
---

UserProcessor (interface)
Methods:
- ~ process(user: User): void
---

UserValidator (interface)
Methods:
- ~ validate(user: User): boolean
---

Operation (interface)
Methods:
- ~ apply(a: double, b: double): double
---

App
Methods:
- ~ main(args: String[]): void
---

Person
Properties:
- - name: String
Methods:
- ~ Person(name: String): Person
Used By: Student (extends, calls-super)
---

Student
Extends: Person
Properties:
- - studentId: int
Methods:
- ~ Student(studentId: int, name: String): Student
- ~ super(): void
Uses: Person (extends, calls-super)
---

BaseService
Properties:
- # serviceName: String
- # initialized: boolean
Methods:
- ~ BaseService(serviceName: String): BaseService
- ~ initialize(): void
- ~ log(): void
- ~ execute(): void
- ~ log(): void
- ~ log(message: String): void
- ~ validate(): void
- ~ if(): void
- ~ IllegalStateException(): throw new
Used By: UserService (extends), UserService (extends, calls-super), AdminService (extends, calls-super), ConfigurableService (extends, calls-super), DetailedService (extends, calls-super), ConstructorTest (extends, calls-super)
---

UserService
Extends: BaseService
Properties:
- - repository: UserRepository
Methods:
- ~ UserService(repository: UserRepository): UserService
- ~ super(): void
- ~ initialize(): void
- ~ log(): void
- ~ execute(): void
- ~ log(): void
- ~ processUsers(): void
- ~ processUsers(): void
Uses: BaseService (extends, calls-super), BaseService (extends, calls-super)
Used By: ExtendedUserService (extends, calls-super)
---

AdminService
Extends: BaseService
Properties:
- - repository: AdminRepository
Methods:
- ~ AdminService(): AdminService
- ~ super(): void
- ~ initialize(): void
- ~ log(): void
- ~ execute(): void
- ~ validate(): void
- ~ performAdminTasks(): void
- ~ performAdminTasks(): void
Uses: BaseService (extends, calls-super), BaseService (extends, calls-super)
---

ExtendedUserService
Extends: UserService
Properties:
- - notificationService: NotificationService
Methods:
- ~ ExtendedUserService(repository: UserRepository, notificationService: NotificationService): ExtendedUserService
- ~ super(): void
- ~ initialize(): void
- ~ log(): void
- ~ execute(): void
- ~ log(): void
Uses: UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super)
---

ConfigurableService
Extends: BaseService
Properties:
- - config: Config
Methods:
- ~ ConfigurableService(): ConfigurableService
- ~ this(): void
- ~ ConfigurableService(name: String): ConfigurableService
- ~ super(): void
- ~ ConfigurableService(name: String, config: Config): ConfigurableService
- ~ super(): void
- ~ initialize(): void
Uses: BaseService (extends, calls-super), BaseService (extends, calls-super)
---

DetailedService
Extends: BaseService
Properties:
- - description: String
Methods:
- ~ DetailedService(name: String, description: String): DetailedService
- ~ super(): void
- ~ toString(): String
- ~ equals(obj: Object): boolean
Uses: BaseService (extends, calls-super), BaseService (extends, calls-super)
---

UserRepository
Methods:
- ~ connect(): void
- ~ loadAll(): void
---

AdminRepository
Methods:
- ~ connect(): void
---

NotificationService
Methods:
- ~ sendNotifications(): void
---

Config
Methods:
- ~ load(): void
---

ConstructorTest
Extends: BaseService
Properties:
- - value: String
Methods:
- ~ ConstructorTest(name: String): ConstructorTest
- ~ super(): void
- ~ execute(): void
- ~ log(): void
Uses: BaseService (extends, calls-super), BaseService (extends, calls-super)
---

ValidationUtils
Properties:
- - MIN_LENGTH: int [static] [readonly]
- - MAX_LENGTH: int [static] [readonly]
Methods:
- ~ isValidEmail(email: String): boolean
- ~ isValidName(name: String): boolean
- ~ normalize(input: String): String
- ~ if(): void
- ~ clamp(value: int, minValue: int, maxValue: int): int
---

StringUtils
Methods:
- ~ isEmpty(str: String): boolean
- ~ isNotEmpty(str: String): boolean
- ~ capitalize(str: String): String
---

UserService
Properties:
- - repository: UserRepository
Methods:
- ~ createUser(name: String, email: String): User
- ~ IllegalArgumentException(): throw new
- ~ IllegalArgumentException(): throw new
- ~ updateUser(id: Long, name: String): User
- ~ IllegalArgumentException(): throw new
Used By: ExtendedUserService (extends, calls-super)
---

UserFactory
Methods:
- ~ createDefault(): User
- ~ User(): return new
- ~ createFromEmail(email: String): User
- ~ User(): return new
- ~ createAdmin(name: String, email: String): User
---

RegistrationService
Properties:
- - repository: UserRepository
Methods:
- ~ registerWithEmail(email: String): User
- ~ registerAdmin(name: String, email: String): User
- ~ IllegalArgumentException(): throw new
- ~ registerDefault(): User
---

MathUtils
Methods:
- ~ add(a: int, b: int): int
- ~ multiply(a: int, b: int): int
- ~ average(): double
- ~ if(): void
- ~ for(): void
---

User
Properties:
- - id: Long
- - name: String
- - email: String
- - role: String
Methods:
- ~ User(name: String, email: String): User
- ~ setName(name: String): void
- ~ setRole(role: String): void
---

UserRepository
Methods:
- ~ findById(id: Long): User
- ~ save(user: User): User
---

UserService
Properties:
- - users: List<User>
Methods:
- ~ getActiveUsers(): List<User>
- ~ getUserNames(): List<String>
- ~ getAdultUsers(): List<User>
- ~ countActiveUsers(): long
- ~ findUserByEmail(email: String): Optional<User>
- ~ groupByRole(): Map<String, List<User>>
- ~ partitionByActive(): Map<Boolean, List<User>>
- ~ getAverageAge(): double
- ~ getUniqueEmails(): Set<String>
- ~ concatenateNames(): String
Used By: ExtendedUserService (extends, calls-super)
---

DataProcessor
Methods:
- ~ processUsers(users: List<User>): List<User>
- ~ countUsersByRole(users: List<User>): Map<String, Long>
- ~ averageAgeByRole(users: List<User>): Map<String, Double>
- ~ getTopUsers(users: List<User>, count: int): List<User>
- ~ anyUserActive(users: List<User>): boolean
- ~ allUsersVerified(users: List<User>): boolean
- ~ findOldestUser(users: List<User>): Optional<User>
---

OrderService
Properties:
- - orders: List<Order>
Methods:
- ~ getAllProducts(): List<Product>
- ~ getTotalProductCount(): long
- ~ getTotalRevenue(): double
- ~ groupProductsByCategory(): Map<String, List<Product>>
---

ParallelProcessor
Methods:
- ~ processUsersParallel(users: List<User>): List<User>
- ~ processUser(user: User): User
- ~ countParallel(users: List<User>): long
---

StreamGenerator
Methods:
- ~ generateNumbers(count: int): List<Integer>
- ~ createUsers(count: int): List<User>
- ~ fibonacci(count: int): List<Integer>
---

Aggregator
Methods:
- ~ findUserWithMaxScore(users: List<User>): Optional<User>
- ~ sumAges(users: List<User>): int
- ~ combineNames(users: List<User>): String
---

User
Properties:
- - name: String
- - email: String
- - age: int
- - role: String
- - active: boolean
- - verified: boolean
- - processed: boolean
- - score: double
Methods:
- ~ User(name: String, email: String): User
- ~ getName(): String
- ~ getEmail(): String
- ~ getAge(): int
- ~ getRole(): String
- ~ isActive(): boolean
- ~ isVerified(): boolean
- ~ setVerified(verified: boolean): void
- ~ setProcessed(processed: boolean): void
- ~ getScore(): double
---

Order
Properties:
- - products: List<Product>
Methods:
- ~ getProducts(): List<Product>
---

Product
Properties:
- - name: String
- - category: String
- - price: double
Methods:
- ~ getCategory(): String
- ~ getPrice(): double
---

UserService
Properties:
- - repository: UserRepository
- # emailService: EmailService
- + logger: Logger
Methods:
- ~ UserService(repository: UserRepository, emailService: EmailService): UserService
- ~ findById(id: Long): User
- ~ findAll(): List<User>
- ~ findByEmail(email: String): Optional<User>
- ~ createUser(dto: UserDTO): User
- ~ updateUser(id: Long, dto: UserDTO, context: ValidationContext): void
- ~ registerUser(request: RegistrationRequest): ServiceResponse<User>
Used By: ExtendedUserService (extends, calls-super)
---

UserRepository
Properties:
- - connection: DatabaseConnection
- - cache: CacheManager
- ~ id: FROM users WHERE
- ~ email: FROM users WHERE
Methods:
- ~ findById(id: Long): User
- ~ if(): void
- ~ findAll(): List<User>
- ~ findByEmail(email: String): Optional<User>
- ~ save(user: User): User
---

User
Properties:
- - id: Long
- - name: String
- - email: String
- - profile: Profile
Methods:
- ~ User(name: String, email: String): User
- ~ update(dto: UserDTO): void
- ~ getId(): Long
- ~ getName(): String
- ~ getEmail(): String
- ~ getProfile(): Profile
---

UserDTO
Properties:
- - name: String
- - email: String
Methods:
- ~ getName(): String
- ~ getEmail(): String
---

EmailService
Methods:
- ~ sendWelcome(user: User): void
---

Logger
Methods:
- ~ log(message: String): void
---

ValidationContext
Methods:
- ~ isValid(dto: UserDTO): boolean
---

RegistrationRequest
Methods:
- ~ toDTO(): UserDTO
- ~ UserDTO(): return new
---

Profile
Properties:
- - bio: String
- - avatar: String
---

DatabaseConnection
Methods:
- ~ query(sql: String): <T> T
- ~ queryList(sql: String): <T> List<T>
- ~ save(entity: T): <T> T
---

CacheManager
Methods:
- ~ get(key: Object): <T> T
- ~ put(key: Object, value: T): <T> void
---

User
Properties:
- - username: String
- - password: String
Methods:
- ~ getUsername(): String
---

DeepService
Methods:
- ~ process(): void
---

BaseController (abstract)
Properties:
- # version: String
Methods:
- ~ initialize(): void
- ~ logRequest(message: String): void
Used By: UserController (extends, imports, calls-super)
---

UserController
Extends: BaseController
Properties:
- - userService: UserService
Methods:
- ~ UserController(userService: UserService): UserController
- ~ initialize(): void
- ~ getUser(id: Long): User
- ~ createUser(dto: UserDTO): User
Uses: BaseController (extends, imports, calls-super)
---

UserDTO
Properties:
- - name: String
- - email: String
Methods:
- ~ getName(): String
- ~ getEmail(): String
---

UserFactory
Methods:
- ~ createDefault(): User
- ~ User(): return new
- ~ createWithEmail(email: String): User
---

IUserService (interface)
Methods:
- ~ findById(id: Long): User
- ~ save(user: User): void
Used By: UserServiceImpl (implements), MultiImpl (implements), UserService (implements, imports)
---

User
Properties:
- - id: Long
- - name: String
- - email: String
Methods:
- ~ getId(): Long
- ~ getName(): String
- ~ getEmail(): String
---

UserRepository
Methods:
- ~ findById(id: Long): User
- ~ save(user: User): void
---

UserService
Implements: IUserService
Properties:
- - repository: UserRepository
- - cache: List<User>
Methods:
- ~ UserService(repository: UserRepository): UserService
- ~ findById(id: Long): User
- ~ save(user: User): void
- ~ create(dto: UserDTO): User
Uses: IUserService (implements, imports), IUserService (implements, imports)
Used By: ExtendedUserService (extends, calls-super)
---

ValidationUtils
Methods:
- ~ validate(input: String): boolean
- ~ sanitize(input: String): String
---

AsyncUserService
Properties:
- + cache: {}
Methods:
- + constructor(): void
- + getUser(userId: any): any [async]
- + updateUser(userId: any, data: any): any [async]
---

[async-chains] (module)
Methods:
- + fetchUser(userId: any): any [static] [async]
- + fetchUserDetails(userId: any): any [static] [async]
- + getUsers(userIds: any): any [static] [async]
- + processUser(userId: any): any [static] [async]
---

BaseService
Properties:
- + isActive: true
Methods:
- + constructor(): void
- + validate(data: any): any
- + process(): any
Used By: UserService (extends), UserService (extends)
---

UserService
Extends: BaseService
Properties:
- + repository: any
- + _cache: {}
Methods:
- + constructor(repository: any): void
- + getUser(userId: any): any
- + createUser(data: any): any
Uses: BaseService (extends), BaseService (extends)
Used By: AdminService (extends)
---

UserRepository
Properties:
- + users: {}
Methods:
- + constructor(): void
- + find(userId: any): any
- + save(user: any): any
Used By: UserService (parameter, uses)
---

IUserService
Methods:
- + getUser(userId: any): any
- + createUser(data: any): any
---

User
Properties:
- + name: any
- + email: any
- + createdAt: any
Methods:
- + constructor(name: any, email: any): void
- + isValid(): any
---

Product
Properties:
- + title: any
- + price: any
Methods:
- + constructor(title: any, price: any): void
---

Order
Properties:
- + userId: any
- + items: any
- + total: 0
Methods:
- + constructor(userId: any, items: any): void
---

UserBuilder
Properties:
- + userData: {}
Methods:
- + constructor(): void
- + withName(name: any): any
- + withEmail(email: any): any
- + build(): any
---

[factory-pattern] (module)
Methods:
- + createUser(name: any, email: any): any [static]
- + createProduct(title: any, price: any): any [static]
- + createValidatedUser(data: any): any [static]
- + createOrder(userId: any, productData: any): any [static]
---

[functional] (module)
Methods:
- + validateUser(data: any): any [static]
- + saveUser(data: any): any [static]
- + createUser(data: any): any [static]
- + updateUser(userId: any, data: any): any [static]
- + getUser(userId: any): any [static]
- + deleteUser(userId: any): any [static]
- + processUsers(users: any): any [static]
---

DataProcessor
Properties:
- + data: any
Methods:
- + constructor(data: any): void
- + transform(transformer: any): any
- + filterBy(predicate: any): any
- + createValidator(rules: any): any
---

[higher-order] (module)
Methods:
- + map(array: any, callback: any): any [static]
- + filter(array: any, predicate: any): any [static]
- + createMultiplier(factor: any): any [static]
- + createGreeter(greeting: any): any [static]
- + compose(f: any, g: any): any [static]
- + fetchData(url: any, callback: any): any [static]
- + processUsers(users: any, validator: any, transformer: any): any [static]
- + add(a: any): any [static]
- + addOne(x: any): any [static]
- + double(x: any): any [static]
---

ImportingService
Properties:
- + service: null
- + users: {}
Methods:
- + constructor(): void
- + process(data: any): any
---

DataProcessor
Methods:
- + processItem(item: any): any
---

[imports] (module)
Methods:
- + transformData(raw: any): any [static]
---

BaseService
Properties:
- + isActive: true
Methods:
- + constructor(): void
- + validate(data: any): any
- + save(data: any): any
Used By: UserService (extends), UserService (extends)
---

UserService
Extends: BaseService
Properties:
- + repository: any
Methods:
- + constructor(repository: any): void
- + validate(data: any): any
- + save(user: any): any
Uses: BaseService (extends), BaseService (extends)
Used By: AdminService (extends)
---

AdminService
Extends: UserService
Properties:
- + logger: any
Methods:
- + constructor(repository: any, logger: any): void
- + save(user: any): any
Uses: UserService (extends), UserService (extends), UserService (extends), UserService (extends)
---

ConfigService
Properties:
- + config: {}
Methods:
- + constructor(): void
- + getConfig(key: any): any
---

[re-exports] (module)
Methods:
- + loadConfig(path: any): any [static]
---

ValidationUtils
Methods:
- + validateEmail(email: any): any [static]
- + validatePassword(password: any): any [static]
- + sanitize(data: any): any [static]
---

UserService
Properties:
- + users: {}
Methods:
- + constructor(): void
- + createUser(email: any, password: any): any
- + updateUser(userId: any, email: any): any
Used By: AdminService (extends)
---

StringUtils
Methods:
- + capitalize(text: any): any [static]
---

NameFormatter
Methods:
- + formatName(name: any): any
---

UserRepository
Properties:
- + users: {}
Methods:
- + constructor(): void
- + find(userId: string): User
- + save(user: User): User
Used By: UserService (parameter, uses)
---

UserService
Properties:
- + repository: UserRepository
- + cache: {}
Methods:
- + constructor(repository: UserRepository): void
- + getUser(userId: string): User
- + createUser(dto: UserDTO): User
Uses: UserRepository (parameter, uses), UserRepository (parameter, uses)
Used By: AdminService (extends)
---

BaseService
Properties:
- # name: mixed
- # logger: mixed
Methods:
- + __construct(name: mixed): void
- + validate(data: mixed): void
- # log(message: mixed): void
Used By: UserService (extends, calls-super), UserService (extends, calls-super)
---

UserRepository
Properties:
- - users: mixed
Methods:
- + find(id: mixed): void
- + save(user: mixed): void
- + findAll(): void
Used By: UserService (parameter, uses)
---

UserService
Extends: BaseService
Properties:
- - repository: mixed
Methods:
- + __construct(repository: mixed): void
- + getUser(id: mixed): void
- + createUser(data: mixed): void
Uses: BaseService (extends, calls-super), BaseService (extends, calls-super)
Used By: UserController (parameter, uses), AdminService (extends, calls-super)
---

IUserService (interface)
Methods:
- + getUser(id: mixed): void
- + createUser(data: mixed): void
---

AbstractService
Methods:
- + process(data: mixed): void
- + preProcess(data: mixed): void
---

User
Properties:
- + name: string
- + email: string
- + createdAt: mixed
Methods:
- + __construct(name: string, email: string): void
Used By: UserBuilder (returns, uses, creates), UserFactory (returns, uses, creates), [factory-pattern] (returns, uses, creates), UserController (returns, uses), UserRepository (returns, parameter, uses), UserService (returns, uses, creates)
---

Product
Properties:
- + title: string
- + price: float
Methods:
- + __construct(title: string, price: float): void
Used By: [factory-pattern] (returns, uses, creates), DataService (parameter, uses)
---

Order
Properties:
- + userId: int
- + items: array
- + total: float
Methods:
- + __construct(userId: int, items: array): void
Used By: [factory-pattern] (returns, uses, creates)
---

UserBuilder
Properties:
- - data: array
Methods:
- + withName(name: string): mixed
- + withEmail(email: string): mixed
- + build(): User
Uses: User (returns, uses, creates), User (returns, uses, creates), User (returns, uses, creates), User (returns, uses, creates)
---

UserFactory
Methods:
- + create(name: string, email: string): User [static]
- + createFromArray(data: array): User [static]
Uses: User (returns, uses, creates), User (returns, uses, creates), User (returns, uses, creates), User (returns, uses, creates)
---

[factory-pattern] (module)
Methods:
- + createUser(name: string, email: string): User
- + createProduct(title: string, price: float): Product
- + createValidatedUser(data: array): User
- + createOrder(userId: int, productData: array): Order
Uses: User (returns, uses, creates), User (returns, uses, creates), User (returns, uses, creates), User (returns, uses, creates), Product (returns, uses, creates), Order (returns, uses, creates)
---

[functional] (module)
Methods:
- + validateUser(data: mixed): void
- + saveUser(data: mixed): void
- + createUser(data: mixed): void
- + updateUser(id: mixed, data: mixed): void
- + getUser(id: mixed): void
- + deleteUser(id: mixed): void
- + processUsers(users: mixed): void
- + transform(data: mixed, callback: mixed): void
---

DataProcessor
Properties:
- - data: array
Methods:
- + __construct(data: array): void
- + transform(transformer: callable): array
- + filterBy(predicate: callable): array
- + createValidator(rules: array): callable
---

[higher-order] (module)
Methods:
- + map(array: array, callback: callable): array
- + filter(array: array, predicate: callable): array
- + createMultiplier(factor: int): callable
- + createGreeter(greeting: string): callable
- + compose(f: callable, g: callable): callable
- + processUsers(users: array, validator: callable, transformer: callable): array
- + add(a: int): callable
- + useBuiltins(numbers: array): array
- + fetchData(url: string, callback: callable): void
---

UserController
Properties:
- - userService: UserService
- - authService: AuthService
Methods:
- + __construct(service: UserService, auth: AuthService): void
- + getUser(id: string): ?User
- + createUser(data: array): UserModel
Uses: UserService (parameter, uses), UserService (parameter, uses), UserService (parameter, uses), UserService (parameter, uses), UserService (parameter, uses), User (returns, uses), User (returns, uses), User (returns, uses), User (returns, uses)
---

DataService
Methods:
- + processUser(user: U): void
- + processProduct(product: Product): void
Uses: Product (parameter, uses)
---

[namespaces] (module)
Methods:
- + processUserData(data: array): void
---

BaseService
Properties:
- # name: string
Methods:
- + __construct(name: string): void
- + validate(data: mixed): bool
- + process(data: mixed): void
Used By: UserService (extends, calls-super), UserService (extends, calls-super)
---

UserService
Extends: BaseService
Methods:
- + __construct(): void
- + validate(data: mixed): bool
- + process(data: mixed): void
Uses: BaseService (extends, calls-super), BaseService (extends, calls-super)
Used By: UserController (parameter, uses), AdminService (extends, calls-super)
---

AdminService
Extends: UserService
Methods:
- + __construct(): void
- + validate(data: mixed): bool
- + process(data: mixed): void
Uses: UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super)
---

UserService
Extends: InternalUserService
Used By: UserController (parameter, uses), AdminService (extends, calls-super)
---

ValidationUtils
Extends: ValidationHelper
---

ConfigService
Properties:
- - config: array
Methods:
- + getConfig(key: string): void
- + setConfig(key: string, value: mixed): void
---

User
Methods:
- + find(id: mixed): void [static]
- + create(data: array): void [static]
Used By: UserBuilder (returns, uses, creates), UserFactory (returns, uses, creates), [factory-pattern] (returns, uses, creates), UserController (returns, uses), UserRepository (returns, parameter, uses), UserService (returns, uses, creates)
---

[re-exports] (module)
Methods:
- + loadConfig(path: string): array
---

ValidationUtils
Methods:
- + validateEmail(email: string): bool [static]
- + validatePassword(password: string): bool [static]
- + sanitize(input: string): string [static]
---

StringUtils
Methods:
- + slugify(text: string): string [static]
- + truncate(text: string, length: int): string [static]
---

UserService
Methods:
- + createUser(data: array): void
Used By: UserController (parameter, uses), AdminService (extends, calls-super)
---

NameFormatter
Methods:
- + format(name: string): string
---

Timestampable
Properties:
- # createdAt: mixed
- # updatedAt: mixed
Methods:
- + touch(): void
- + getCreatedAt(): void
---

SoftDeletable
Properties:
- # deletedAt: mixed
Methods:
- + delete(): void
- + restore(): void
- + isDeleted(): bool
---

Loggable
Properties:
- # logs: mixed
Methods:
- + log(message: string): void
- + getLogs(): array
---

User
Properties:
- + name: mixed
- + email: mixed
Methods:
- + __construct(name: string, email: string): void
- + save(): void
Used By: UserBuilder (returns, uses, creates), UserFactory (returns, uses, creates), [factory-pattern] (returns, uses, creates), UserController (returns, uses), UserRepository (returns, parameter, uses), UserService (returns, uses, creates)
---

Article
Properties:
- + title: mixed
Methods:
- + __construct(title: string): void
---

A
Methods:
- + hello(): void
---

B
Methods:
- + hello(): void
---

Greeting
---

User
Properties:
- + name: string
- + email: string
- + age: int
Methods:
- + __construct(name: string, email: string): void
Used By: UserBuilder (returns, uses, creates), UserFactory (returns, uses, creates), [factory-pattern] (returns, uses, creates), UserController (returns, uses), UserRepository (returns, parameter, uses), UserService (returns, uses, creates)
---

UserDTO
Properties:
- + name: string
- + email: string
Used By: UserService (parameter, uses)
---

UserRepository
Properties:
- - users: array
Methods:
- + find(id: string): ?User
- + save(user: User): User
- + findAll(): array
Uses: User (returns, parameter, uses), User (returns, parameter, uses), User (returns, parameter, uses), User (returns, parameter, uses)
Used By: UserService (parameter, uses)
---

UserService
Properties:
- - repository: UserRepository
Methods:
- + __construct(repository: UserRepository): void
- + getUser(id: string): ?User
- + createFromDTO(dto: UserDTO): User
- + getUsers(): array
Uses: UserRepository (parameter, uses), UserRepository (parameter, uses), User (returns, uses, creates), User (returns, uses, creates), User (returns, uses, creates), User (returns, uses, creates), UserDTO (parameter, uses)
Used By: UserController (parameter, uses), AdminService (extends, calls-super)
---

AsyncUserService
Properties:
- + cache: Any
Methods:
- - __init__(): None
- + get_user(user_id: str): None [async]
- + update_user(user_id: str, data: dict): None [async]
---

[async_chains] (module)
Methods:
- + fetch_user(user_id: str): None [async]
- + fetch_user_details(user_id: str): None [async]
- + get_users(user_ids: list): None [async]
- + process_user(user_id: str): None [async]
---

BaseService
Properties:
- + is_active: Any
Methods:
- - __init__(): None
- + validate(data: Any): None
- + process(): None
Used By: UserService (extends), UserService (extends)
---

UserService
Extends: BaseService
Properties:
- + repository: Any
- + _cache: Any
Methods:
- - __init__(repository: Any): None
- + get_user(user_id: str): None
- + create_user(data: dict): None
Uses: BaseService (extends), BaseService (extends)
Used By: AdminService (extends)
---

UserRepository
Properties:
- + users: Any
Methods:
- - __init__(): None
- + find(user_id: str): None
- + save(user: Any): None
Used By: UserService (uses)
---

IUserService
Methods:
- + get_user(user_id: str): None
- + create_user(data: dict): None
---

UserService
Properties:
- + _users: Any
Methods:
- - __init__(): None
- + user_count(): int
- + validate_email(email: str): bool [static]
- + from_config(cls: Any, config: dict): 'UserService' [static]
- + get_user(user_id: int): Optional[dict]
- + decorator(func: Any): None
Used By: AdminService (extends)
---

APIController
Methods:
- + list_users(): None
- + get_user(user_id: int): None
---

CachedService
Properties:
- + _cache: Any
Methods:
- - __init__(): None
- + cache(): None
- + cache(value: Any): None
- + cache(): None
---

[decorators] (module)
Methods:
- + route(path: str): None
---

User
Properties:
- + name: Any
- + email: Any
- + created_at: Any
Methods:
- - __init__(name: str, email: str): None
- + is_valid(): bool
Used By: UserBuilder (uses), UserFactory (uses), [factory_pattern] (uses), UserRepository (uses), UserService (uses)
---

Product
Properties:
- + title: Any
- + price: Any
Methods:
- - __init__(title: str, price: float): None
Used By: Order (uses), [factory_pattern] (uses)
---

Order
Properties:
- + user_id: Any
- + items: Any
- + total: Any
Methods:
- - __init__(user_id: int, items: List[Product]): None
Uses: Product (uses)
Used By: [factory_pattern] (uses)
---

UserBuilder
Properties:
- + user_data: Any
Methods:
- - __init__(): None
- + with_name(name: str): 'UserBuilder'
- + with_email(email: str): 'UserBuilder'
- + build(): User
Uses: User (uses), User (uses), User (uses)
---

UserFactory
Methods:
- + create_standard_user(name: str, email: str): User [static]
- + create_from_dict(cls: Any, data: dict): User [static]
Uses: User (uses), User (uses), User (uses)
---

[factory_pattern] (module)
Methods:
- + create_user(name: str, email: str): User
- + create_product(title: str, price: float): Product
- + create_validated_user(data: dict): User
- + create_order(user_id: int, product_data: List[dict]): Order
- + create_user_from_type(user_type: str, data: dict): User
Uses: User (uses), User (uses), User (uses), Product (uses), Order (uses)
---

[functional] (module)
Methods:
- + validate_user(data: dict): bool
- + save_user(data: dict): None
- + create_user(data: dict): None
- + update_user(user_id: str, data: dict): None
- + get_user(user_id: str): None
- + delete_user(user_id: str): bool
- + process_users(users: list): None
---

DataProcessor
Properties:
- + data: Any
Methods:
- - __init__(data: List[Any]): None
- + transform(transformer: Callable[[Any], Any: Any): List[Any]
- + filter_by(predicate: Callable[[Any], bool: Any): List[Any]
- + create_validator(rules: List[Callable]): Callable[[Any], bool]
- + validator(item: Any): bool
---

[higher_order] (module)
Methods:
- + map_list(array: List[T], callback: Callable[[T], U: Any): List[U]
- + filter_list(array: List[T], predicate: Callable[[T], bool: Any): List[T]
- + create_multiplier(factor: int): Callable[[int], int]
- + create_greeter(greeting: str): Callable[[str], str]
- + compose(f: Callable, g: Callable): Callable
- + timing_decorator(func: Callable): Callable
- + add(a: int): Callable[[int], int]
- + partial(func: Callable, args: Any): Callable
- + use_builtins(numbers: List[int]): List[int]
- + fetch_data(url: str, callback: Callable[[dict], None: Any): None
---

ImportingService
Properties:
- + service: Any
Methods:
- - __init__(): None
- + process(data: Dict): Optional
---

DataProcessor
Methods:
- + process_item(item: dict): None
---

[imports] (module)
Methods:
- + transform_data(raw: dict): dict
---

Person
Properties:
- + name: Any
Methods:
- - __init__(name: Any): None
Used By: Student (extends)
---

Student
Extends: Person
Properties:
- + student_id: Any
Methods:
- - __init__(student_id: Any, name: Any): None
Uses: Person (extends)
---

App
Methods:
- + main(): None [static]
---

MultiLineSignatureApp
Methods:
- + main(argv: Any): None [static]
---

BaseService
Properties:
- + is_active: Any
Methods:
- - __init__(): None
- + validate(data: dict): bool
- + save(data: dict): None
Used By: UserService (extends), UserService (extends)
---

UserService
Extends: BaseService
Properties:
- + repository: Any
Methods:
- - __init__(repository: Any): None
- + validate(data: dict): bool
- + save(user: dict): None
Uses: BaseService (extends), BaseService (extends)
Used By: AdminService (extends)
---

AdminService
Extends: UserService
Properties:
- + logger: Any
Methods:
- - __init__(repository: Any, logger: Any): None
- + save(user: dict): None
Uses: UserService (extends), UserService (extends), UserService (extends), UserService (extends), UserService (extends)
---

ConfigService
Properties:
- + config: Any
Methods:
- - __init__(): None
- + get_config(key: str): None
---

[re_exports] (module)
Methods:
- + load_config(path: str): dict
---

ValidationUtils
Methods:
- + validate_email(email: str): bool [static]
- + validate_password(password: str): bool [static]
- + sanitize(data: str): str [static]
---

UserService
Properties:
- + users: Any
Methods:
- - __init__(): None
- + create_user(email: str, password: str): None
- + update_user(user_id: str, email: str): None
Used By: AdminService (extends)
---

StringUtils
Methods:
- + get_instance(cls: Any): None [static]
- + capitalize(text: str): str [static]
---

NameFormatter
Methods:
- + format_name(name: str): str
---

User
Properties:
- + name: Any
- + email: Any
- + id: Any
Methods:
- - __init__(name: str, email: str): None
Used By: UserBuilder (uses), UserFactory (uses), [factory_pattern] (uses), UserRepository (uses), UserService (uses)
---

UserDTO
Properties:
- + name: Any
- + email: Any
Methods:
- - __init__(data: dict): None
Used By: UserRepository (uses), UserService (uses)
---

UserRepository
Properties:
- + users: Any
Methods:
- - __init__(): None
- + find(user_id: str): User
- + save(user: User): User
- + create_from_dto(dto: UserDTO): User
Uses: User (uses), User (uses), User (uses), UserDTO (uses)
Used By: UserService (uses)
---

UserService
Properties:
- + repository: UserRepository
- + cache: Any
Methods:
- - __init__(repository: UserRepository): None
- + get_user(user_id: str): User
- + create_user(dto: UserDTO): User
Uses: UserRepository (uses), UserRepository (uses), User (uses), User (uses), User (uses), UserDTO (uses)
Used By: AdminService (extends)
---

fetchUser (module)
Methods:
- + fetchUser(id: string): Promise<User | null> [async]
---

validateUserAsync (module)
Methods:
- + validateUserAsync(user: User): Promise<boolean> [async]
---

saveUserAsync (module)
Methods:
- + saveUserAsync(user: User): Promise<User> [async]
---

getUser (module)
Methods:
- + getUser(id: string): Promise<User | null> [async]
---

createAndSaveUser (module)
Methods:
- + createAndSaveUser(data: any): Promise<User | null> [async]
---

getUsersParallel (module)
Methods:
- + getUsersParallel(ids: string[]): Promise<User[]> [async]
---

getValidatedUser (module)
Methods:
- + getValidatedUser(id: string): Promise<User | null> [async]
---

transformUserData (module)
Methods:
- + transformUserData(data: any): Promise<User> [async]
---

User (interface)
Properties:
- + id: string
- + name: string
- + email: string
---

IUserService (interface)
Methods:
- + getUser(id: string): User | null
- + createUser(data: UserDTO): User
Used By: UserService (implements), UserManager (implements, imports)
---

BaseService (abstract)
Methods:
- # validate(data: any): boolean
- # log(message: string): void
Used By: UserService (extends, calls-super), UserService (extends, calls-super)
---

UserRepository
Methods:
- + find(id: string): User | null
- + save(user: User): User
---

UserService
Extends: BaseService
Implements: IUserService
Properties:
- - repo: UserRepository
Methods:
- + constructor(repo: UserRepository): void
- # validate(data: any): boolean
- + getUser(id: string): User | null
- + createUser(data: UserDTO): User
Uses: BaseService (extends, calls-super), BaseService (extends, calls-super), IUserService (implements)
Used By: AdminService (extends, calls-super)
---

User
Properties:
- + name: string
- + email: string
Methods:
- + constructor(name: string, email: string): void
---

UserDTO (interface)
Properties:
- + name: string
- + email: string
---

User
Properties:
- + id: string
- + name: string
- + email: string
Methods:
- + constructor(id: string, name: string, email: string): void
---

UserDTO
Properties:
- + name: string
- + email: string
Methods:
- + constructor(name: string, email: string): void
---

createUser (module)
Methods:
- + createUser(data: UserDTO): User
---

createValidatedUser (module)
Methods:
- + createValidatedUser(data: any): User | null
---

createEntity (module)
Methods:
- + createEntity(type: string, data: any): User | Admin
---

UserFactory
Methods:
- + create(data: UserDTO): User [static]
- + createBatch(dataList: UserDTO[]): User[] [static]
---

UserBuilder
Properties:
- - id: string
- - name: string
- - email: string
Methods:
- + setId(id: string): this
- + setName(name: string): this
- + setEmail(email: string): this
- + build(): User
---

Admin
Properties:
- + id: string
- + name: string
- + role: string
Methods:
- + constructor(id: string, name: string, role: string): void
---

generateId (module)
Methods:
- + generateId(): string
---

validate (module)
Methods:
- + validate(data: any): boolean
---

validateUser (module)
Methods:
- + validateUser(data: any): boolean
---

saveUser (module)
Methods:
- + saveUser(data: any): User
---

createUser (module)
Methods:
- + createUser(data: any): User | null
---

findUser (module)
Methods:
- + findUser(id: string): User | null
---

processUser (module)
Methods:
- + processUser(data: any): User | null
---

User (interface)
Properties:
- + id: string
- + name: string
- + email: string
---

updateUser (module)
Methods:
- + updateUser(id: string, data: any): User | null
---

map (module)
Methods:
- + map(items: T[], fn: (item: T) => U): U[]
---

filter (module)
Methods:
- + filter(items: T[], predicate: (item: T) => boolean): T[]
---

reduce (module)
Methods:
- + reduce(items: T[], fn: (acc: U, item: T) => U, initial: U): U
---

processUsers (module)
Methods:
- + processUsers(users: User[], callback: (user: User) => void): void
---

createValidator (module)
Methods:
- + createValidator(rule: (item: T) => boolean): (item: T) => boolean
---

Repository
Properties:
- - items: T[]
Methods:
- + add(item: T): void
- + findBy(predicate: (item: T) => boolean): T | undefined
- + map(fn: (item: T) => U): U[]
---

getUserNames (module)
Methods:
- + getUserNames(users: User[]): string[]
---

getActiveUsers (module)
Methods:
- + getActiveUsers(users: User[]): User[]
---

compose (module)
Methods:
- + compose(fn1: (x: T) => T, fn2: (x: T) => T): (x: T) => T
---

curry (module)
Methods:
- + curry(fn: (a: T, b: U) => V): (a: T) => (b: U) => V
---

getProperty (module)
Methods:
- + getProperty(obj: T, key: K): T[K]
---

pair (module)
Methods:
- + pair(first: T, second: U): [T, U]
---

User (interface)
Properties:
- + id: string
- + name: string
- + email: string
- + isActive: boolean
---

createFactory (module)
Methods:
- + createFactory(constructor: new (...args: any[]) => T): (...args: any[]) => T
---

UserManager
Implements: IUserService
Properties:
- - service: Service
- - validator: DefaultValidator
Methods:
- + constructor(): void
- + getUser(id: string): User | null
- + createUser(data: UserDTO): User
Uses: IUserService (implements, imports)
---

UserService
Properties:
- - repository: UserRepository
Methods:
- + constructor(repository: UserRepository): void
- + getUser(id: string): User | null
Used By: AdminService (extends, calls-super)
---

UserRepository (interface)
Methods:
- + find(id: string): User | null
---

User (interface)
Properties:
- + id: string
- + name: string
---

formatUserName (module)
Methods:
- + formatUserName(user: User): string
---

logUserAccess (module)
Methods:
- + logUserAccess(user: User): void
---

auditUserAccess (module)
Methods:
- + auditUserAccess(user: User): void
---

buildAuditLine (module)
Methods:
- + buildAuditLine(): string
---

isValidUser (module)
Methods:
- + isValidUser(user: User): boolean
---

BaseService
Methods:
- # validate(data: any): boolean
- # save(data: any): any
- # log(message: string): void
Used By: UserService (extends, calls-super), UserService (extends, calls-super)
---

UserService
Extends: BaseService
Methods:
- # validate(data: any): boolean
- # save(data: any): any
- + createUser(data: any): any
Uses: BaseService (extends, calls-super), BaseService (extends, calls-super)
Used By: AdminService (extends, calls-super)
---

AdminService
Extends: UserService
Methods:
- # validate(data: any): boolean
Uses: UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super), UserService (extends, calls-super)
---

re-exports (module)
---

ValidationUtils
Methods:
- + validate(data: any): boolean [static]
- + validateEmail(email: string): boolean [static]
- + validateAge(age: number): boolean [static]
---

StringUtils
Methods:
- + trim(value: string): string [static]
- + isEmpty(value: string): boolean [static]
---

UserService
Methods:
- + createUser(data: any): User | null
- + updateUser(id: string, data: any): User | null
Used By: AdminService (extends, calls-super)
---

User
Properties:
- + name: string
- + email: string
Methods:
- + constructor(name: string, email: string): void
---

UserRepository
Methods:
- + findById(id: string): User | null
- + findAll(): User[]
- + save(data: any): Promise<User>
---

UserDTO
Properties:
- + name: string
- + email: string
Methods:
- + constructor(name: string, email: string): void
---

User
Properties:
- + id: string
- + name: string
- + email: string
Methods:
- + constructor(id: string, name: string, email: string): void
---

UserService
Properties:
- - repo: UserRepository
- - validator: UserValidator
Methods:
- + constructor(repo: UserRepository): void
- + getUsers(): User[]
- + create(data: UserDTO): Promise<User>
- + updateUser(id: string, data: UserDTO): Promise<User | null> [async]
Used By: AdminService (extends, calls-super)
---

UserValidator
Methods:
- + validate(data: any): boolean
---

DefaultValidator
Methods:
- + validate(data: any): boolean
---

FolderConfig (interface)
Properties:
- + selected: boolean
- + expanded: boolean
- + order: number | null
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

GET /users (route)
---

GET /path (route)
---

POST /path (route)
---

GET /api/users (route)
---

POST /api/users (route)
---

GET /api/users/:id (route)
---

PUT /api/users/:id (route)
---

DELETE /api/users/:id (route)
---

PATCH /api/users/:id (route)
---

GET /api/posts (route)
---

POST /api/posts (route)
---

