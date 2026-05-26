import { Project, SourceFile, ClassDeclaration, MethodDeclaration, PropertyDeclaration } from 'ts-morph';

export interface ClassInfo {
  name: string;
  properties: PropertyInfo[];
  methods: MethodInfo[];
  extends?: string;
  implements?: string[];
}

export interface PropertyInfo {
  name: string;
  type: string;
  visibility: string;
}

export interface MethodInfo {
  name: string;
  parameters: string[];
  returnType: string;
  visibility: string;
  body?: string;
}

export class CodeParser {
  private project: Project;

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: true,
    });
  }

  parseTypeScript(code: string, fileName: string = 'temp.ts'): ClassInfo[] {
    const sourceFile = this.project.createSourceFile(fileName, code, { overwrite: true });
    return this.extractClasses(sourceFile);
  }

  private extractClasses(sourceFile: SourceFile): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    sourceFile.getClasses().forEach(cls => {
      classes.push(this.extractClassInfo(cls));
    });

    return classes;
  }

  private extractClassInfo(cls: ClassDeclaration): ClassInfo {
    const properties: PropertyInfo[] = [];
    const methods: MethodInfo[] = [];

    // Extract properties
    cls.getProperties().forEach(prop => {
      properties.push({
        name: prop.getName(),
        type: prop.getType().getText(),
        visibility: this.getVisibility(prop),
      });
    });

    // Extract methods
    cls.getMethods().forEach(method => {
      methods.push(this.extractMethodInfo(method));
    });

    return {
      name: cls.getName() || 'Anonymous',
      properties,
      methods,
      extends: cls.getExtends()?.getText(),
      implements: cls.getImplements().map(i => i.getText()),
    };
  }

  private extractMethodInfo(method: MethodDeclaration): MethodInfo {
    const parameters = method.getParameters().map(p => {
      const name = p.getName();
      const type = p.getType().getText();
      return `${name}: ${type}`;
    });

    return {
      name: method.getName(),
      parameters,
      returnType: method.getReturnType().getText(),
      visibility: this.getVisibility(method),
      body: method.getBodyText(),
    };
  }

  private getVisibility(node: PropertyDeclaration | MethodDeclaration): string {
    if (node.hasModifier(118)) return 'private'; // ts.SyntaxKind.PrivateKeyword
    if (node.hasModifier(119)) return 'protected'; // ts.SyntaxKind.ProtectedKeyword
    return 'public';
  }

  generateClassDiagram(classes: ClassInfo[]): string {
    if (classes.length === 0) {
      return `classDiagram
        note "No classes found in this file"`;
    }

    let diagram = 'classDiagram\n';

    classes.forEach(cls => {
      diagram += `  class ${cls.name} {\n`;

      // Add properties
      cls.properties.forEach(prop => {
        const symbol = this.getVisibilitySymbol(prop.visibility);
        diagram += `    ${symbol}${prop.type} ${prop.name}\n`;
      });

      // Add methods
      cls.methods.forEach(method => {
        const symbol = this.getVisibilitySymbol(method.visibility);
        const params = method.parameters.join(', ');
        diagram += `    ${symbol}${method.name}(${params})\n`;
      });

      diagram += '  }\n';

      // Add inheritance
      if (cls.extends) {
        diagram += `  ${cls.extends} <|-- ${cls.name}\n`;
      }

      // Add implementations
      cls.implements?.forEach(iface => {
        diagram += `  ${iface} <|.. ${cls.name}\n`;
      });
    });

    return diagram;
  }

  generateSequenceDiagram(method: MethodInfo, className: string): string {
    let diagram = 'sequenceDiagram\n';
    diagram += '  participant Client\n';
    diagram += `  participant ${className}\n`;

    // Parse method body for calls
    const calls = this.extractMethodCalls(method.body || '');
    
    if (calls.length === 0) {
      diagram += `  Client->>+${className}: ${method.name}()\n`;
      diagram += `  ${className}-->>-Client: ${method.returnType}\n`;
      diagram += `  Note over Client,${className}: No method calls detected\n`;
    } else {
      diagram += `  Client->>+${className}: ${method.name}()\n`;
      
      const participants = new Set<string>();
      calls.forEach(call => {
        if (!participants.has(call.object)) {
          participants.add(call.object);
          diagram += `  participant ${call.object}\n`;
        }
      });

      calls.forEach(call => {
        diagram += `  ${className}->>+${call.object}: ${call.method}()\n`;
        diagram += `  ${call.object}-->>-${className}: result\n`;
      });

      diagram += `  ${className}-->>-Client: ${method.returnType}\n`;
    }

    return diagram;
  }

  private extractMethodCalls(body: string): Array<{ object: string; method: string }> {
    const calls: Array<{ object: string; method: string }> = [];
    
    // Simple regex to find method calls like: object.method() or this.method()
    const callPattern = /(\w+)\.(\w+)\s*\(/g;
    let match;

    while ((match = callPattern.exec(body)) !== null) {
      const object = match[1];
      const method = match[2];
      
      if (object !== 'this' && object !== 'console') {
        calls.push({ object, method });
      }
    }

    return calls;
  }

  private getVisibilitySymbol(visibility: string): string {
    switch (visibility) {
      case 'private':
        return '-';
      case 'protected':
        return '#';
      case 'public':
      default:
        return '+';
    }
  }
}

export const codeParser = new CodeParser();
