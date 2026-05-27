import { NextRequest, NextResponse } from 'next/server';

interface C4ContextRequest {
  owner: string;
  repo: string;
}

interface C4ContainerRequest {
  owner: string;
  repo: string;
  rootPath?: string;
}

interface C4ComponentRequest {
  owner: string;
  repo: string;
  folderPath: string;
}

// Analyze repository and generate C4 Context diagram
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, owner, repo, folderPath } = body;

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (level === 'context') {
      const diagram = await generateContextDiagram(owner, repo, token);
      return NextResponse.json({ diagram });
    } else if (level === 'container') {
      const diagram = await generateContainerDiagram(owner, repo, token);
      return NextResponse.json({ diagram });
    } else if (level === 'component') {
      const diagram = await generateComponentDiagram(owner, repo, folderPath || '', token);
      return NextResponse.json({ diagram });
    }

    return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
  } catch (error) {
    console.error('[API /c4] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate C4 diagram', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function generateContextDiagram(owner: string, repo: string, token: string): Promise<string> {
  try {
    // Fetch package.json to understand dependencies
    const pkgResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    let dependencies: string[] = [];
    let devDependencies: string[] = [];

    if (pkgResponse.ok) {
      const pkgData = await pkgResponse.json();
      const content = Buffer.from(pkgData.content, 'base64').toString('utf-8');
      const pkg = JSON.parse(content);
      dependencies = Object.keys(pkg.dependencies || {}).slice(0, 5);
      devDependencies = Object.keys(pkg.devDependencies || {}).slice(0, 3);
    }

    // Build C4 Context diagram
    let diagram = `C4Context
    title System Context for ${repo}
    
    Person(dev, "Developer", "Uses and maintains the system")
    System(app, "${repo}", "Main application system")
    System_Ext(github, "GitHub", "Source code repository")
    `;

    // Add major dependencies as external systems
    dependencies.forEach((dep, idx) => {
      const safeName = dep.replace(/[^a-zA-Z0-9]/g, '_');
      diagram += `System_Ext(${safeName}, "${dep}", "External dependency")\n    `;
    });

    diagram += `\n    Rel(dev, app, "Develops and maintains")
    Rel(app, github, "Hosted on")
    `;

    dependencies.forEach((dep, idx) => {
      const safeName = dep.replace(/[^a-zA-Z0-9]/g, '_');
      diagram += `Rel(app, ${safeName}, "Uses")\n    `;
    });

    return diagram;
  } catch (error) {
    console.error('Failed to generate context diagram:', error);
    return `C4Context
      title System Context for ${repo}
      
      Person(dev, "Developer")
      System(app, "${repo}", "Application")
      
      Rel(dev, app, "Uses")
      
      UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")`;
  }
}

async function generateContainerDiagram(owner: string, repo: string, token: string): Promise<string> {
  try {
    // Fetch root directory structure
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch repo contents');
    }

    const contents = await response.json();
    const folders = contents.filter((item: any) => item.type === 'dir');

    // Build C4 Container diagram
    let diagram = `C4Container
    title Container Diagram for ${repo}
    
    Person(dev, "Developer")
    System_Boundary(sys, "${repo}") {
    `;

    // Add top-level folders as containers
    const commonContainers = ['src', 'app', 'lib', 'components', 'services', 'api', 'pages', 'public'];
    const detectedContainers = folders
      .filter((f: any) => commonContainers.includes(f.name.toLowerCase()))
      .slice(0, 8);

    detectedContainers.forEach((folder: any, idx: number) => {
      const name = folder.name;
      const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
      const description = getContainerDescription(name);
      diagram += `      Container(${safeName}, "${name}", "Module", "${description}")\n`;
    });

    diagram += `    }\n    \n    Rel(dev, ${detectedContainers[0]?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'sys'}, "Interacts with")\n`;

    // Add some basic relationships
    if (detectedContainers.length > 1) {
      for (let i = 0; i < Math.min(detectedContainers.length - 1, 3); i++) {
        const from = detectedContainers[i].name.replace(/[^a-zA-Z0-9]/g, '_');
        const to = detectedContainers[i + 1].name.replace(/[^a-zA-Z0-9]/g, '_');
        diagram += `    Rel(${from}, ${to}, "Uses")\n`;
      }
    }

    return diagram;
  } catch (error) {
    console.error('Failed to generate container diagram:', error);
    return `C4Container
      title Container Diagram for ${repo}
      
      Person(dev, "Developer")
      System_Boundary(sys, "${repo}") {
        Container(app, "Application", "Code", "Main application code")
      }
      
      Rel(dev, app, "Uses")`;
  }
}

async function generateComponentDiagram(owner: string, repo: string, folderPath: string, token: string): Promise<string> {
  try {
    // Fetch folder contents
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch folder contents');
    }

    const contents = await response.json();
    const files = contents.filter((item: any) => 
      item.type === 'file' && 
      (item.name.endsWith('.ts') || item.name.endsWith('.tsx') || 
       item.name.endsWith('.js') || item.name.endsWith('.jsx'))
    ).slice(0, 10);

    const folderName = folderPath.split('/').pop() || 'Module';

    let diagram = `C4Component
    title Component Diagram for ${folderName}
    
    Container_Boundary(container, "${folderName}") {
    `;

    files.forEach((file: any) => {
      const fileName = file.name.replace(/\.(ts|tsx|js|jsx)$/, '');
      const safeName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileType = getFileType(file.name);
      diagram += `      Component(${safeName}, "${fileName}", "${fileType}", "Implementation")\n`;
    });

    diagram += `    }\n`;

    // Add simple relationships between first few components
    if (files.length > 1) {
      for (let i = 0; i < Math.min(files.length - 1, 3); i++) {
        const from = files[i].name.replace(/\.(ts|tsx|js|jsx)$/, '').replace(/[^a-zA-Z0-9]/g, '_');
        const to = files[i + 1].name.replace(/\.(ts|tsx|js|jsx)$/, '').replace(/[^a-zA-Z0-9]/g, '_');
        diagram += `    Rel(${from}, ${to}, "Imports")\n`;
      }
    }

    return diagram;
  } catch (error) {
    console.error('Failed to generate component diagram:', error);
    return `C4Component
      title Component Diagram
      
      Container_Boundary(container, "Module") {
        Component(comp1, "Component", "Code", "Implementation")
      }`;
  }
}

function getContainerDescription(folderName: string): string {
  const descriptions: Record<string, string> = {
    'src': 'Source code',
    'app': 'Application logic',
    'lib': 'Shared libraries',
    'components': 'UI components',
    'services': 'Business services',
    'api': 'API endpoints',
    'pages': 'Page components',
    'public': 'Static assets',
    'utils': 'Utility functions',
    'hooks': 'React hooks',
    'types': 'Type definitions',
    'styles': 'Styling',
  };
  return descriptions[folderName.toLowerCase()] || 'Module';
}

function getFileType(fileName: string): string {
  if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) return 'React Component';
  if (fileName.endsWith('.ts')) return 'TypeScript';
  if (fileName.endsWith('.js')) return 'JavaScript';
  return 'Code';
}
