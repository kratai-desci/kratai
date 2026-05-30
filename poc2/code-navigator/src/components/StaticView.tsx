'use client';

import { useState, useEffect, useRef } from 'react';
import { useCaseDiagram, deploymentDiagram, layersOverviewDiagram, classDiagram } from '@/data/diagrams';
import { sequenceDiagrams } from '@/data/sequenceDiagrams';

// Architecture documentation content
const ARCHITECTURE_DOC = `# Architecture Documentation

## Overview

This document provides a comprehensive view of the system architecture for the AIBoard project. It follows a 4-layer clean architecture pattern with clear separation of concerns.

## Table of Contents

1. [Use Case Diagram](#use-case-diagram)
2. [Deployment Diagram](#deployment-diagram)
3. [Package Diagram (Layers)](#package-diagram)
4. [Class Diagram](#class-diagram)
5. [Design Principles](#design-principles)

---

## Use Case Diagram

### Purpose
The use case diagram shows the functional requirements from the user's perspective. It identifies actors, their goals, and how they interact with the system.

### Key Actors
- **User**: End user who manages projects and views analytics
- **System**: Internal automated processes
- **MongoDB**: Data persistence layer
- **GitHub**: External integration for repository management

### Diagram Code

\`\`\`mermaid
flowchart TB
    User((User))
    System((System))
    
    subgraph "Project Management"
        UC1[Create Project]:::added
        UC2[View Project]
        UC3[Update Project]:::modified
        UC4[Delete Project]
    end
    
    subgraph "Analytics - NEW"
        UC5[View Analytics Dashboard]:::added
        UC6[Generate Reports]:::added
    end
    
    subgraph "Agent Management"
        UC7[Create Agent]
        UC8[Configure Agent]
        UC9[Upload Avatar]
    end
    
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    
    UC1 -.-> GitHub[GitHub API]:::external
    UC5 -.-> MongoDB[MongoDB]:::external
    
    classDef added fill:#22c55e,stroke:#16a34a,stroke-width:3px
    classDef modified fill:#eab308,stroke:#ca8a04,stroke-width:3px
    classDef external fill:#3b82f6,stroke:#2563eb,stroke-width:2px
\`\`\`

### Recent Changes
- ✅ **Added**: Analytics Dashboard use cases (View Analytics, Generate Reports)
- 🔄 **Modified**: Project creation now integrates with GitHub
- 🔄 **Modified**: Update Project enhanced with validation

---

## Deployment Diagram

### Purpose
Shows the physical deployment of the system across different runtime environments and how components are distributed.

### Architecture Style
- **Frontend**: Next.js 16 (React) deployed on Vercel
- **Backend**: Serverless API routes (Next.js API)
- **Database**: MongoDB Atlas (cloud-hosted)
- **External Services**: GitHub API for repository management

### Diagram Code

\`\`\`mermaid
C4Deployment
    title Deployment Diagram - AIBoard

    Deployment_Node(client, "Client Browser", "Web Browser") {
        Container(spa, "AIBoard Web App", "Next.js, React", "User interface")
    }
    
    Deployment_Node(vercel, "Vercel", "Cloud Platform") {
        Container(api, "API Routes", "Next.js Serverless", "Handles API requests"):::modified
    }
    
    Deployment_Node(atlas, "MongoDB Atlas", "Database Cloud") {
        ContainerDb(db, "MongoDB", "NoSQL Database", "Stores all data")
    }
    
    Deployment_Node(github, "GitHub", "External Service") {
        Container(ghapi, "GitHub API", "REST API", "Repository management"):::added
    }
    
    Rel(spa, api, "HTTPS/REST", "Makes API calls")
    Rel(api, db, "MongoDB Protocol", "Reads/writes data")
    Rel(api, ghapi, "HTTPS", "Creates repos")
    
    classDef modified fill:#eab308,stroke:#ca8a04,stroke-width:3px
    classDef added fill:#22c55e,stroke:#16a34a,stroke-width:3px
\`\`\`

### Key Characteristics
- **Scalability**: Serverless architecture auto-scales
- **Reliability**: MongoDB Atlas provides 99.95% SLA
- **Security**: All connections over HTTPS/TLS
- **Performance**: CDN-backed Next.js deployment

---

## Package Diagram (4-Layer Architecture)

### Purpose
Illustrates the logical organization of code into layers, showing dependencies and package structure.

### Layer Descriptions

#### Layer 1: UI (l1_ui)
- **Responsibility**: Presentation logic, user interaction
- **Technologies**: React components, Tailwind CSS
- **Dependencies**: Can only depend on Layer 2 (Controllers)
- **Changes**: New AnalyticsDashboard component added

#### Layer 2: Controllers (l2_controllers)
- **Responsibility**: Application logic, use cases
- **Technologies**: TypeScript classes (Use Cases)
- **Dependencies**: Can depend on Layer 3 (Model)
- **Changes**: Enhanced validation, GitHub integration

#### Layer 3: Model (l3_model)
- **Responsibility**: Business logic, domain entities
- **Technologies**: Domain models, repository interfaces
- **Dependencies**: No dependencies on outer layers
- **Changes**: ProjectModel now includes githubRepo field

#### Layer 4: Infrastructure (l4_infra)
- **Responsibility**: Technical implementation, external integrations
- **Technologies**: MongoDB drivers, API clients
- **Dependencies**: Implements Layer 3 interfaces
- **Changes**: Repository implementations updated

### Diagram Code

\`\`\`mermaid
flowchart TB
    subgraph Layer1["🎨 Layer 1: UI (l1_ui)"]
        PD[ProjectDashboard]:::modified
        AD[AnalyticsDashboard]:::added
    end
    
    subgraph Layer2["🎯 Layer 2: Controllers (l2_controllers)"]
        CPUC[CreateProjectUseCase]:::modified
        VAUC[ViewAnalyticsUseCase]:::added
        AgentUC[Agent Use Cases]
    end
    
    subgraph Layer3["💼 Layer 3: Model (l3_model)"]
        PM[ProjectModel]:::modified
        AM[AgentModel]
        IRepo[IProjectRepository]:::modified
    end
    
    subgraph Layer4["🔧 Layer 4: Infrastructure (l4_infra)"]
        MongoRepo[MongoProjectRepository]:::modified
        GitHub[GitHubClient]:::added
    end
    
    PD --> CPUC
    AD --> VAUC
    CPUC --> PM
    CPUC --> IRepo
    VAUC --> IRepo
    IRepo --> MongoRepo
    CPUC -.-> GitHub
    
    classDef added fill:#22c55e,stroke:#16a34a,stroke-width:3px
    classDef modified fill:#eab308,stroke:#ca8a04,stroke-width:3px
\`\`\`

### Dependency Rules
1. **Layer 1** can only depend on **Layer 2**
2. **Layer 2** can only depend on **Layer 3**
3. **Layer 3** has no dependencies (pure domain)
4. **Layer 4** implements **Layer 3** interfaces

---

## Class Diagram

### Purpose
Details the classes, their attributes, methods, and relationships within the system.

### Key Relationships
- **Composition**: UI components compose use cases
- **Dependency**: Use cases depend on repository interfaces
- **Implementation**: Concrete repositories implement interfaces
- **Association**: Models are passed between layers

### Diagram Code

\`\`\`mermaid
classDiagram
    %% Layer 1: UI
    class ProjectDashboard {
        +render()
        +handleCreate()
    }:::modified
    
    class AnalyticsDashboard {
        +render()
        +fetchMetrics()
    }:::added
    
    %% Layer 2: Controllers
    class CreateProjectUseCase {
        -repo: IProjectRepository
        +execute(data): ProjectModel
    }:::modified
    
    class ViewAnalyticsUseCase {
        -repo: ISessionRepository
        +execute(projectId): AnalyticsMetrics
    }:::added
    
    %% Layer 3: Model
    class ProjectModel {
        -id: string
        -name: string
        -githubRepo: string
        +validate(): void
    }:::modified
    
    class IProjectRepository {
        <<interface>>
        +create(model): ProjectModel
        +findById(id): ProjectModel
    }:::modified
    
    %% Layer 4: Infrastructure
    class MongoProjectRepository {
        -client: MongoClient
        +create(model): ProjectModel
        +findById(id): ProjectModel
    }:::modified
    
    class GitHubClient {
        -token: string
        +createRepository(name): RepoInfo
    }:::added
    
    %% Relationships
    ProjectDashboard --> CreateProjectUseCase
    AnalyticsDashboard --> ViewAnalyticsUseCase
    CreateProjectUseCase --> ProjectModel
    CreateProjectUseCase --> IProjectRepository
    CreateProjectUseCase ..> GitHubClient
    IProjectRepository <|.. MongoProjectRepository
    
    classDef added fill:#22c55e,stroke:#16a34a,stroke-width:3px
    classDef modified fill:#eab308,stroke:#ca8a04,stroke-width:3px
\`\`\`

### Recent Changes Summary

| Component | Type | Change Description |
|-----------|------|-------------------|
| AnalyticsDashboard | Added ✅ | New UI component for viewing metrics |
| ViewAnalyticsUseCase | Added ✅ | New use case for analytics logic |
| GitHubClient | Added ✅ | External integration for repo creation |
| ProjectDashboard | Modified 🔄 | Enhanced with GitHub integration |
| CreateProjectUseCase | Modified 🔄 | Now creates GitHub repos |
| ProjectModel | Modified 🔄 | Added githubRepo field + validation |
| MongoProjectRepository | Modified 🔄 | Updated document mapping |

---

## Design Principles

### 1. Dependency Inversion
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Example: \`CreateProjectUseCase\` depends on \`IProjectRepository\`, not \`MongoProjectRepository\`

### 2. Single Responsibility
- Each class has one reason to change
- UI components handle presentation only
- Use cases handle application logic only
- Models contain business rules only

### 3. Open/Closed Principle
- Open for extension, closed for modification
- Example: Adding GitHub integration didn't break existing project creation flow
- New features added through composition, not modification

### 4. Interface Segregation
- Clients shouldn't depend on interfaces they don't use
- Example: \`IProjectRepository\` has focused methods (create, findById)
- Not a bloated "IRepository" with 50 methods

### 5. Clean Architecture Benefits
- ✅ **Testability**: Each layer can be tested independently
- ✅ **Maintainability**: Changes isolated to specific layers
- ✅ **Flexibility**: Easy to swap implementations (e.g., MongoDB → PostgreSQL)
- ✅ **Scalability**: Clear boundaries enable team parallelization

---

## Usage with AI Agents

### Context for AI Coding Assistants

When working with AI agents on this codebase, provide this document as context along with:

1. **Current Task**: Describe what you're building
2. **Affected Layers**: Specify which layers will change
3. **Integration Points**: Note where new code connects
4. **Diagram References**: Point to specific diagrams

### Example Prompt Template

\`\`\`
I'm adding a new feature: [FEATURE_NAME]

Context from Architecture.md:
- This affects Layer [1/2/3/4]
- Related use cases: [USE_CASE_NAMES]
- Involved classes: [CLASS_NAMES]

Please implement following the established patterns shown in the [DIAGRAM_TYPE] diagram.
Ensure dependency rules are maintained (Layer N depends only on Layer N+1).
\`\`\`

### Best Practices
1. Always reference the appropriate diagram when discussing changes
2. Maintain the color coding convention (green=new, yellow=modified)
3. Update this document when adding major features
4. Keep diagrams in sync with actual code structure

---

*Last Updated: 2026-05-31*
*Version: 1.0*
`;

// Helper: find the class name for a clicked method element by walking up the SVG DOM
function findClassForMethodElement(methodEl: Element): string | null {
  // Walk up to find the nearest <g> node group that represents a class
  let node: Element | null = methodEl;
  while (node && node.tagName.toLowerCase() !== 'g') {
    node = node.parentElement;
  }
  // Keep walking up to find a group whose first text-like child is the class name
  while (node) {
    // Look for class-name text within this group (a <p> without parens)
    const candidates = node.querySelectorAll('p, span, text');
    for (const c of Array.from(candidates)) {
      const t = c.textContent?.trim() || '';
      if (t && !t.includes('(') && !t.startsWith('+') && !t.startsWith('-') && !t.startsWith('#') && t.length < 50) {
        // Likely a class name
        return t;
      }
    }
    node = node.parentElement;
  }
  return null;
}

interface StaticViewProps {
  selectedFile: string | null;
  syncEnabled: boolean;
  onFileSelect?: (file: string | null) => void;
  onMethodSelect?: (method: string | null) => void;
}

// Map files to their classes for single-class diagrams
const fileToClassMap: Record<string, { className: string, layer: string, diff: string }> = {
  // Layer 1 - UI Components
  'aiboard/src/l1_ui/pages/ProjectDashboard.tsx': { className: 'ProjectDashboard', layer: 'Layer1_UI', diff: 'modified' },
  'aiboard/src/l1_ui/pages/AnalyticsDashboard.tsx': { className: 'AnalyticsDashboard', layer: 'Layer1_UI', diff: 'added' },
  'aiboard/src/l1_ui/pages/ProjectBoard.tsx': { className: 'ProjectBoard', layer: 'Layer1_UI', diff: 'unchanged' },
  'aiboard/src/l1_ui/pages/AgentManagement.tsx': { className: 'AgentManagement', layer: 'Layer1_UI', diff: 'unchanged' },
  
  // Layer 2 - Controllers/Use Cases
  'aiboard/src/l2_controllers/project/CreateProjectUseCase.ts': { className: 'CreateProjectUseCase', layer: 'Layer2_Controllers', diff: 'modified' },
  'aiboard/src/l2_controllers/project/GetProjectUseCase.ts': { className: 'GetProjectUseCase', layer: 'Layer2_Controllers', diff: 'unchanged' },
  'aiboard/src/l2_controllers/task/CreateTaskUseCase.ts': { className: 'CreateTaskUseCase', layer: 'Layer2_Controllers', diff: 'unchanged' },
  'aiboard/src/l2_controllers/task/MoveTaskUseCase.ts': { className: 'MoveTaskUseCase', layer: 'Layer2_Controllers', diff: 'unchanged' },
  'aiboard/src/l2_controllers/project/AddColumnUseCase.ts': { className: 'AddColumnUseCase', layer: 'Layer2_Controllers', diff: 'unchanged' },
  'aiboard/src/l2_controllers/agent/CreateAgentUseCase.ts': { className: 'CreateAgentUseCase', layer: 'Layer2_Controllers', diff: 'unchanged' },
  'aiboard/src/l2_controllers/agent/DeleteAgentUseCase.ts': { className: 'DeleteAgentUseCase', layer: 'Layer2_Controllers', diff: 'unchanged' },
  'aiboard/src/l2_controllers/agent/ListAgentsUseCase.ts': { className: 'ListAgentsUseCase', layer: 'Layer2_Controllers', diff: 'unchanged' },
  'aiboard/src/l2_controllers/agent/SetAgentContextFilesUseCase.ts': { className: 'SetAgentContextFilesUseCase', layer: 'Layer2_Controllers', diff: 'unchanged' },
  'aiboard/src/l2_controllers/agent/UpdateAgentUseCase.ts': { className: 'UpdateAgentUseCase', layer: 'Layer2_Controllers', diff: 'unchanged' },
  'aiboard/src/l2_controllers/agent/UploadAgentAvatarUseCase.ts': { className: 'UploadAgentAvatarUseCase', layer: 'Layer2_Controllers', diff: 'unchanged' },
  'aiboard/src/l2_controllers/analytics/ViewAnalyticsUseCase.ts': { className: 'ViewAnalyticsUseCase', layer: 'Layer2_Controllers', diff: 'added' },
  
  // Layer 3 - Domain Models
  'aiboard/src/l3_model/ProjectModel.ts': { className: 'ProjectModel', layer: 'Layer3_Domain', diff: 'modified' },
  'aiboard/src/l3_model/TaskModel.ts': { className: 'TaskModel', layer: 'Layer3_Domain', diff: 'unchanged' },
  'aiboard/src/l3_model/AgentModel.ts': { className: 'AgentModel', layer: 'Layer3_Domain', diff: 'unchanged' },
  'aiboard/src/l3_model/SessionModel.ts': { className: 'SessionModel', layer: 'Layer3_Domain', diff: 'unchanged' },
  'aiboard/src/l3_model/IProjectRepository.ts': { className: 'IProjectRepository', layer: 'Layer3_Domain', diff: 'unchanged' },
  'aiboard/src/l3_model/ITaskRepository.ts': { className: 'ITaskRepository', layer: 'Layer3_Domain', diff: 'unchanged' },
  'aiboard/src/l3_model/IAgentRepository.ts': { className: 'IAgentRepository', layer: 'Layer3_Domain', diff: 'unchanged' },
  'aiboard/src/l3_model/ISessionRepository.ts': { className: 'ISessionRepository', layer: 'Layer3_Domain', diff: 'unchanged' },
  
  // Layer 4 - Infrastructure
  'aiboard/src/l4_infra/strategies/mongodb/MongoProjectRepository.ts': { className: 'MongoProjectRepository', layer: 'Layer4_Infrastructure', diff: 'modified' },
  'aiboard/src/l4_infra/strategies/mongodb/MongoTaskRepository.ts': { className: 'MongoTaskRepository', layer: 'Layer4_Infrastructure', diff: 'unchanged' },
  'aiboard/src/l4_infra/strategies/mongodb/MongoAgentRepository.ts': { className: 'MongoAgentRepository', layer: 'Layer4_Infrastructure', diff: 'unchanged' },
  'aiboard/src/l4_infra/strategies/mongodb/MongoSessionRepository.ts': { className: 'MongoSessionRepository', layer: 'Layer4_Infrastructure', diff: 'unchanged' },
};

function generateSingleClassDiagram(filePath: string): string | null {
  const classInfo = fileToClassMap[filePath];
  if (!classInfo) {
    return null;
  }

  const { className, layer, diff } = classInfo;
  let diagram = 'classDiagram\n';

  // Add the single class based on which layer it's in
  if (layer === 'Layer1_UI') {
    diagram += `    class ${className}{\n        +render()\n        +handleCreate()\n    }\n`;
  } else if (layer === 'Layer2_Controllers') {
    diagram += `    class ${className}{\n        -repo\n        +execute()\n    }\n`;
  } else if (layer === 'Layer3_Domain') {
    if (className.endsWith('Model')) {
      diagram += `    class ${className}{\n        +id\n        +name\n        +validate()\n    }\n`;
    } else {
      diagram += `    class ${className}{\n        +create()*\n        +findById()*\n    }\n`;
    }
  } else if (layer === 'Layer4_Infrastructure') {
    diagram += `    class ${className}{\n        -client\n        +create()\n    }\n`;
  }

  // Add styling based on diff status
  if (diff === 'added') {
    diagram += `    class ${className}:::added\n`;
  } else if (diff === 'modified') {
    diagram += `    class ${className}:::modified\n`;
  } else {
    diagram += `    class ${className}:::unchanged\n`;
  }

  diagram += `    
    classDef added fill:#22c55e,stroke:#16a34a,stroke-width:4px
    classDef modified fill:#eab308,stroke:#ca8a04,stroke-width:4px
    classDef unchanged fill:#e5e7eb,stroke:#9ca3af,stroke-width:2px`;

  return diagram;
}

export default function StaticView({ selectedFile, syncEnabled, onFileSelect, onMethodSelect }: StaticViewProps) {
  const [activeTab, setActiveTab] = useState<'usecase' | 'deployment' | 'layers' | 'class'>('usecase');
  const [mermaidRendered, setMermaidRendered] = useState(false);
  const [diagramKey, setDiagramKey] = useState(0);
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [showArchitectureDoc, setShowArchitectureDoc] = useState(false);
  const diagramContainerRef = useRef<HTMLDivElement>(null);

  // Compute diagram and single class diagram BEFORE useEffect hooks
  const diagram = activeTab === 'deployment' ? deploymentDiagram : activeTab === 'layers' ? layersOverviewDiagram : activeTab === 'class' ? classDiagram : useCaseDiagram;
  const singleClassDiagram = selectedFile ? generateSingleClassDiagram(selectedFile) : null;
  const selectedClassName = selectedFile ? fileToClassMap[selectedFile]?.className : null;

  useEffect(() => {
    // Dynamically load and render Mermaid (client-side only)
    const renderMermaid = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });
        
        // Render the diagram directly to SVG
        const diagramCode = singleClassDiagram || diagram.mermaidCode;
        const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const { svg } = await mermaid.render(uniqueId, diagramCode);
        setRenderedSvg(svg);
        setMermaidRendered(true);
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        setMermaidRendered(true); // Still set to true to hide loading
      }
    };

    // Re-render when tab changes OR when file selection changes
    setMermaidRendered(false);
    setRenderedSvg('');
    setDiagramKey(prev => prev + 1); // Force remount
    setTimeout(renderMermaid, 100);
  }, [activeTab, selectedFile, singleClassDiagram, diagram.mermaidCode]);

  // Handle diagram click for drill-down navigation
  useEffect(() => {
    const handleDiagramClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mermaidDiv = target.closest('.mermaid');
      
      if (mermaidDiv) {
        // Deployment → Package
        if (activeTab === 'deployment') {
          setActiveTab('layers');
        }
        // Package → Class
        else if (activeTab === 'layers') {
          setActiveTab('class');
        }
      }
    };

    document.addEventListener('click', handleDiagramClick);
    return () => document.removeEventListener('click', handleDiagramClick);
  }, [activeTab]);

  // Handle method clicks in class diagrams using EVENT DELEGATION
  useEffect(() => {
    const container = diagramContainerRef.current;
    if (!container || !onMethodSelect) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const text = target.textContent?.trim() || '';

      if (text.includes('(') && text.includes(')') && text.length < 50 && target.children.length === 0) {
        // Extract method name (strip +/-/# prefix and parentheses)
        const methodName = text.replace(/^[+\-#]/, '').replace(/\(.*\)$/, '').trim();
        if (!methodName) return;

        // Find the class this method belongs to by walking up the SVG
        const className = findClassForMethodElement(target);
        if (!className) return;

        const key = `${className}.${methodName}`;
        if (sequenceDiagrams[key]) {
          e.stopPropagation();
          e.preventDefault();
          console.log('Method clicked:', key);
          onMethodSelect(key);
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [onMethodSelect]);

  // Apply visual styling to clickable methods (methods that have a sequence diagram)
  useEffect(() => {
    if (!mermaidRendered || !diagramContainerRef.current) return;

    const applyStyling = (attempt = 1) => {
      const svgElement = diagramContainerRef.current?.querySelector('svg');
      if (!svgElement) {
        if (attempt < 10) setTimeout(() => applyStyling(attempt + 1), 300);
        return;
      }

      const textElements = svgElement.querySelectorAll('p, span, text');
      if (textElements.length === 0 && attempt < 10) {
        setTimeout(() => applyStyling(attempt + 1), 300);
        return;
      }

      textElements.forEach((el) => {
        const text = el.textContent?.trim() || '';
        if (!text.includes('(') || !text.includes(')') || text.length >= 50) return;

        // Skip wrapper elements
        const hasChildWithSameText = Array.from(el.children).some(
          (child) => child.textContent?.trim() === text
        );
        if (hasChildWithSameText) return;

        const methodName = text.replace(/^[+\-#]/, '').replace(/\(.*\)$/, '').trim();
        if (!methodName) return;

        const className = findClassForMethodElement(el);
        if (!className) return;

        const key = `${className}.${methodName}`;
        if (sequenceDiagrams[key]) {
          const htmlEl = el as HTMLElement;
          htmlEl.style.cursor = 'pointer';
          htmlEl.style.color = '#2563eb';
          htmlEl.style.textDecoration = 'underline';
          htmlEl.style.fontWeight = '600';
          htmlEl.setAttribute('data-clickable', key);
        }
      });
    };

    setTimeout(() => applyStyling(1), 500);
    const interval = setInterval(() => applyStyling(1), 2000);
    return () => clearInterval(interval);
  }, [mermaidRendered, activeTab, selectedFile]);

  const { changesSummary } = diagram;

  return (
    <div className="flex-1 bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* Header with Tabs */}
      <div className="h-12 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h2 className="text-white font-semibold">Structure View</h2>
        </div>

        {/* Tabs and Architecture Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setActiveTab('usecase');
                onFileSelect?.(null);
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeTab === 'usecase'
                  ? 'bg-slate-700/50 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              Use Cases
            </button>
          <button
            onClick={() => {
              setActiveTab('deployment');
              onFileSelect?.(null);
            }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'deployment'
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            Deployment
          </button>
          <button
            onClick={() => {
              setActiveTab('layers');
              onFileSelect?.(null);
            }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'layers'
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            Package
          </button>
          <button
            onClick={() => {
              setActiveTab('class');
              onFileSelect?.(null);
            }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'class'
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            Class
          </button>
          </div>
          
          {/* Architecture.md Button */}
          <button
            onClick={() => setShowArchitectureDoc(!showArchitectureDoc)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
            title="View Architecture Documentation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Architecture.md
          </button>
        </div>
      </div>

      {/* Change Summary Bar */}
      {(activeTab === 'usecase' || activeTab === 'deployment' || activeTab === 'layers' || activeTab === 'class') && (
        <div className="px-4 py-2 bg-slate-800/30 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">Changes:</span>
            <div className="flex items-center gap-1">
              <span className="text-green-500 font-semibold">+{changesSummary.added}</span>
              <span className="text-slate-500">added</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 font-semibold">~{changesSummary.modified}</span>
              <span className="text-slate-500">modified</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">{changesSummary.unchanged}</span>
              <span className="text-slate-500">unchanged</span>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {changesSummary.added + changesSummary.modified + changesSummary.deleted} {activeTab === 'deployment' ? 'components' : activeTab === 'layers' ? 'packages' : activeTab === 'class' ? 'classes' : 'use cases'} affected
          </div>
        </div>
      )}

      {/* Main Diagram Area */}
      <div className="flex-1 overflow-auto" ref={diagramContainerRef}>
        {/* Selected File Class Diagram - ONLY show this when a class file is selected */}
        {singleClassDiagram ? (
          <div className="w-full h-full p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-white">Selected Class: {selectedClassName}</h3>
                  <p className="text-sm text-slate-400">{selectedFile}</p>
                </div>
                <button
                  onClick={() => onFileSelect?.(null)}
                  className="p-2 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white transition-colors"
                  title="Clear selection"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="relative bg-slate-800/30 rounded-lg p-8 min-h-[calc(100vh-300px)]">
              {/* Loading Overlay */}
              {!mermaidRendered && (
                <div className="absolute inset-0 bg-slate-800/30 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 text-sm">Rendering diagram...</p>
                  </div>
                </div>
              )}
              
              <div 
                key={`single-${selectedFile}-${diagramKey}`}
                className="mermaid-container single-class-diagram"
                dangerouslySetInnerHTML={{ __html: renderedSvg }}
                style={{
                  opacity: mermaidRendered ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px',
                  background: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  pointerEvents: 'auto'
                }}
              />
            </div>
            
            <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-3">Legend</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-slate-300">Added (New class)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span className="text-slate-300">Modified (Changed class)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-slate-400"></div>
                  <span className="text-slate-300">Unchanged (Existing class)</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'usecase' || activeTab === 'deployment' || activeTab === 'layers' || activeTab === 'class' ? (
          <div className="w-full h-full p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-1">{diagram.title}</h3>
              <p className="text-sm text-slate-400">{diagram.description}</p>
            </div>
            
            <div className="relative bg-slate-800/30 rounded-lg p-8 min-h-[calc(100vh-300px)]">
              {/* Loading Overlay */}
              {!mermaidRendered && (
                <div className="absolute inset-0 bg-slate-800/30 rounded-lg flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 text-sm">Rendering diagram...</p>
                  </div>
                </div>
              )}
              
              {/* Mermaid Diagram - Rendered as SVG */}
              <div 
                key={diagramKey} 
                className={`mermaid-container main-diagram ${(activeTab === 'deployment' || activeTab === 'layers') ? 'cursor-pointer hover:opacity-90' : ''}`}
                title={activeTab === 'deployment' ? 'Click to view Package diagram' : activeTab === 'layers' ? 'Click to view Class diagram' : ''}
                dangerouslySetInnerHTML={{ __html: renderedSvg }}
                style={{
                  opacity: mermaidRendered ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px',
                  background: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  pointerEvents: 'auto'
                }}
              />
              
              {/* Force text and line visibility for all diagrams */}
              <style jsx global>{`
                .main-diagram text,
                .single-class-diagram text {
                  fill: #000;
                  font-size: 14px !important;
                }
                .main-diagram .classTitle,
                .single-class-diagram .classTitle {
                  fill: #000 !important;
                  font-weight: bold !important;
                }
                .main-diagram path,
                .single-class-diagram path,
                .main-diagram line,
                .single-class-diagram line {
                  stroke: #333 !important;
                  stroke-width: 2px !important;
                }
                .main-diagram .arrowheadPath,
                .single-class-diagram .arrowheadPath {
                  fill: #333 !important;
                }
                .main-diagram marker path,
                .single-class-diagram marker path {
                  fill: #333 !important;
                  stroke: #333 !important;
                }
              `}</style>
            </div>
            
            <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-3">Legend</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {activeTab === 'layers' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-slate-300">Added (New component)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-slate-300">Modified (Changed)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-400"></div>
                      <span className="text-slate-300">Unchanged (Existing)</span>
                    </div>
                  </>
                ) : activeTab === 'class' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-slate-300">Added (New class)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-slate-300">Modified (Changed class)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-400"></div>
                      <span className="text-slate-300">Unchanged (Existing class)</span>
                    </div>
                  </>
                ) : activeTab === 'deployment' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-slate-300">Modified Component</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-slate-300">Unchanged Component</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-500"></div>
                      <span className="text-slate-300">External Service</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-slate-300">Added (New functionality)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span className="text-slate-300">Modified (Enhanced)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-slate-400"></div>
                      <span className="text-slate-300">Unchanged (Existing)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-slate-300">Actor (User/System)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-slate-800/50 rounded-2xl flex items-center justify-center border border-slate-700">
                <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-slate-300 font-medium mb-2">Component Diagrams</h3>
              <p className="text-slate-500 text-sm max-w-md">
                Component diagrams showing code structure coming soon
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className="h-12 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <div className="h-4 w-px bg-slate-700"></div>
          <button className="px-2 py-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white text-xs transition-colors">
            Fit
          </button>
          <button className="px-2 py-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white text-xs transition-colors">
            Reset
          </button>
        </div>

        <div className="text-xs text-slate-500">
          {syncEnabled && <span className="text-green-500">● Synced</span>}
        </div>
      </div>
      
      {/* Architecture Documentation Modal */}
      {showArchitectureDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowArchitectureDoc(false)}>
          <div className="bg-slate-800 rounded-lg w-full max-w-5xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xl font-semibold text-white">Architecture.md</h2>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">Documentation</span>
              </div>
              <button
                onClick={() => setShowArchitectureDoc(false)}
                className="p-2 hover:bg-slate-700/50 rounded text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono leading-relaxed bg-slate-900/50 p-6 rounded-lg">
                  {ARCHITECTURE_DOC}
                </pre>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                💡 <strong>Tip:</strong> Copy sections of this document to provide context when working with AI coding assistants
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(ARCHITECTURE_DOC);
                }}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
