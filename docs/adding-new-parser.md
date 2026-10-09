# Adding a New Language Parser

This guide explains how to add support for a new programming language to Kratai's class diagram generation system.

## Architecture Overview

Kratai uses an **abstract base class pattern** for language parsers. All parsers extend `AbstractParserStrategy`, which provides:

1. **Abstract contract** - Methods that must be implemented
2. **Helper utilities** - Reusable methods for ID generation and relationship creation
3. **Type safety** - Ensures consistent behavior across all parsers

```
AbstractParserStrategy (abstract base class)
    ├── createClassId() - Protected helper
    ├── createRelationshipsToTargets() - Protected helper
    │
    ├── TypeScriptParser extends AbstractParserStrategy
    ├── JavaScriptParser extends AbstractParserStrategy
    ├── PythonParser extends AbstractParserStrategy
    ├── PHPParser extends AbstractParserStrategy
    └── [Your New Parser] extends AbstractParserStrategy
```

---

## Step-by-Step Guide

### Step 1: Create the Parser File

**Location:** `src/services/parsing/languages/{Language}Parser.ts`

**Template:**
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { AbstractParserStrategy } from './AbstractParserStrategy';
import { ClassInfo, PropertyInfo, MethodInfo, ClassRelationship } from '../../../types/domain';

/**
 * {Language} parser for extracting classes, methods, and relationships
 * Supports: [List key language features you support]
 */
export class {Language}Parser extends AbstractParserStrategy {
    supportedExtensions = ['.{ext1}', '.{ext2}']; // e.g., ['.go', '.mod']

    parseFile(filePath: string): ClassInfo[] {
        const classes: ClassInfo[] = [];

        try {
            const sourceCode = fs.readFileSync(filePath, 'utf-8');
            
            // TODO: Parse source code and extract classes
            // Use language-specific AST parser here
            
        } catch (error) {
            // Return empty on error - never crash the extension
        }

        return classes;
    }

    extractRelationships(
        classes: ClassInfo[],
        allClassNames: Set<string>,
        workspacePath: string
    ): ClassRelationship[] {
        const relationships: ClassRelationship[] = [];

        // Build map of className -> all ClassInfo with that name
        const classMap = new Map<string, ClassInfo[]>();
        classes.forEach(cls => {
            if (!classMap.has(cls.name)) {
                classMap.set(cls.name, []);
            }
            classMap.get(cls.name)!.push(cls);
        });

        for (const classInfo of classes) {
            // Use helper method to generate unique IDs
            const fromId = this.createClassId(classInfo);

            // TODO: Extract relationships using helper methods
            // See examples below
        }

        return relationships;
    }
}
```

---

## Step 2: Implement `parseFile()`

### Purpose
Extract all classes, interfaces, functions, and modules from a single source file.

### Key Patterns

#### Pattern 1: Use Language-Specific AST Parser
```typescript
import * as parser from '{language-parser-package}';

parseFile(filePath: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    try {
        const sourceCode = fs.readFileSync(filePath, 'utf-8');
        const ast = parser.parse(sourceCode); // Language-specific parsing
        
        // Walk the AST
        this.visitNode(ast, (node) => {
            if (this.isClassDeclaration(node)) {
                classes.push(this.extractClassInfo(node, filePath));
            }
            if (this.isInterfaceDeclaration(node)) {
                classes.push(this.extractInterfaceInfo(node, filePath));
            }
            // ... handle other constructs
        });
        
    } catch (error) {
        // Return empty array on parse errors
    }
    
    return classes;
}
```

#### Pattern 2: Extract Class Information
```typescript
private extractClassInfo(node: ASTNode, filePath: string): ClassInfo {
    return {
        name: this.getClassName(node),
        filePath: filePath, // CRITICAL: Always use absolute or workspace-relative paths
        properties: this.extractProperties(node),
        methods: this.extractMethods(node),
        extends: this.getExtendsClass(node), // Single parent class
        implements: this.getImplementsInterfaces(node), // Array of interface names
        isAbstract: this.isAbstract(node),
        isInterface: this.isInterface(node),
        classType: this.determineClassType(node) // 'class' | 'interface' | 'abstract' | 'module'
    };
}
```

#### Pattern 3: Extract Properties
```typescript
private extractProperties(node: ASTNode): PropertyInfo[] {
    const properties: PropertyInfo[] = [];
    
    // Find property declarations in AST
    const propertyNodes = this.findPropertyNodes(node);
    
    propertyNodes.forEach(propNode => {
        properties.push({
            name: this.getPropertyName(propNode),
            type: this.getPropertyType(propNode) || 'any',
            visibility: this.getVisibility(propNode), // 'public' | 'private' | 'protected'
            isStatic: this.isStatic(propNode),
            isReadonly: this.isReadonly(propNode),
            lineNumber: this.getStartLine(propNode),
            endLineNumber: this.getEndLine(propNode)
        });
    });
    
    return properties;
}
```

#### Pattern 4: Extract Methods
```typescript
private extractMethods(node: ASTNode): MethodInfo[] {
    const methods: MethodInfo[] = [];
    
    const methodNodes = this.findMethodNodes(node);
    
    methodNodes.forEach(methodNode => {
        methods.push({
            name: this.getMethodName(methodNode),
            parameters: this.extractParameters(methodNode),
            returnType: this.getReturnType(methodNode) || 'void',
            visibility: this.getVisibility(methodNode),
            isStatic: this.isStatic(methodNode),
            isAsync: this.isAsync(methodNode),
            lineNumber: this.getStartLine(methodNode),
            endLineNumber: this.getEndLine(methodNode)
        });
    });
    
    return methods;
}
```

---

## Step 3: Implement `extractRelationships()`

### Purpose
Identify how classes relate to each other (inheritance, composition, calls, imports, etc.)

### CRITICAL: Use Helper Methods

**❌ DON'T repeat this pattern:**
```typescript
// BAD - Manual ID generation (duplicates code, error-prone)
const targets = classMap.get(targetName) || [];
targets.forEach(target => {
    const toId = `${target.filePath}__${target.name}`;
    relationships.push({ from: fromId, to: toId, type: 'extends' });
});
```

**✅ DO use helper methods:**
```typescript
// GOOD - Use AbstractParserStrategy helpers
relationships.push(...this.createRelationshipsToTargets(
    classInfo, targetName, classMap, 'extends'
));
```

### Relationship Types

#### 1. **Inheritance Relationships**
```typescript
// EXTENDS (class inheritance)
if (classInfo.extends) {
    relationships.push(...this.createRelationshipsToTargets(
        classInfo, classInfo.extends, classMap, 'extends'
    ));
}

// IMPLEMENTS (interface implementation)
if (classInfo.implements) {
    for (const iface of classInfo.implements) {
        relationships.push(...this.createRelationshipsToTargets(
            classInfo, iface, classMap, 'implements'
        ));
    }
}
```

#### 2. **Composition Relationships** (Property Types)
```typescript
// Extract type names from property declarations
for (const prop of classInfo.properties) {
    this.extractTypeNames(prop.type).forEach(typeName => {
        if (allClassNames.has(typeName) && typeName !== classInfo.name) {
            relationships.push(...this.createRelationshipsToTargets(
                classInfo, typeName, classMap, 'composition'
            ));
        }
    });
}
```

#### 3. **Method Relationships** (Return Types & Parameters)
```typescript
// RETURNS relationships
for (const method of classInfo.methods) {
    this.extractTypeNames(method.returnType).forEach(typeName => {
        if (allClassNames.has(typeName) && typeName !== classInfo.name) {
            relationships.push(...this.createRelationshipsToTargets(
                classInfo, typeName, classMap, 'returns'
            ));
        }
    });
}

// PARAMETER relationships
for (const method of classInfo.methods) {
    for (const param of method.parameters) {
        this.extractTypeNames(param.type).forEach(typeName => {
            if (allClassNames.has(typeName) && typeName !== classInfo.name) {
                relationships.push(...this.createRelationshipsToTargets(
                    classInfo, typeName, classMap, 'parameter'
                ));
            }
        });
    }
}
```

#### 4. **Advanced Relationships** (Optional)
```typescript
// CREATES (factory patterns - new ClassName())
if (hasInstantiationOf(className)) {
    relationships.push(...this.createRelationshipsToTargets(
        classInfo, className, classMap, 'creates'
    ));
}

// CALLS-STATIC (ClassName.staticMethod())
if (hasStaticCallTo(className)) {
    relationships.push(...this.createRelationshipsToTargets(
        classInfo, className, classMap, 'calls-static'
    ));
}

// IMPORTS (import statements)
if (imports.has(className)) {
    relationships.push(...this.createRelationshipsToTargets(
        classInfo, className, classMap, 'imports'
    ));
}

// CALLS (function-to-function calls)
if (callsFunction(funcName)) {
    relationships.push(...this.createRelationshipsToTargets(
        classInfo, funcName, classMap, 'calls',
        (target) => target.isModule === true // Filter condition
    ));
}
```

### Helper Method: `extractTypeNames()`

**Purpose:** Parse type annotations and extract class names

```typescript
private extractTypeNames(typeString: string): string[] {
    // List of primitive/built-in types to exclude
    const nonClassTypes = new Set([
        'string', 'number', 'boolean', 'void', 'any', 'unknown',
        'int', 'float', 'double', 'char', 'byte', // Add language-specific primitives
        'null', 'undefined', 'Promise', 'Array', 'Map', 'Set'
    ]);
    
    const types: string[] = [];
    
    // Extract class names (usually PascalCase)
    const identifierRegex = /\b([A-Z][a-zA-Z0-9]*)\b/g;
    let match;
    
    while ((match = identifierRegex.exec(typeString)) !== null) {
        if (!nonClassTypes.has(match[1])) {
            types.push(match[1]);
        }
    }
    
    return types;
}
```

---

## Step 4: Register in ParserFactory

**File:** `src/services/parsing/languages/ParserFactory.ts`

```typescript
import { {Language}Parser } from './{Language}Parser';

export class ParserFactory {
    private parsers: Map<string, AbstractParserStrategy> = new Map();

    constructor() {
        this.register(new TypeScriptParser());
        this.register(new JavaScriptParser());
        this.register(new PythonParser());
        this.register(new PHPParser());
        this.register(new {Language}Parser()); // Add your parser
    }
    
    // ... rest of the class
}
```

---

## Step 5: Create Test Fixtures

**Directory:** `test-fixtures/{language}/`

Create comprehensive test cases:

```
test-fixtures/{language}/
├── README.md                          # Describe test scenarios
├── 01-basic-classes/
│   ├── SimpleClass.{ext}             # Basic class structure
│   ├── Inheritance.{ext}             # Extends/implements
│   └── README.md
├── 02-complex-features/
│   ├── Generics.{ext}                # Generic types
│   ├── Interfaces.{ext}              # Interface definitions
│   └── Composition.{ext}             # Property types
└── 03-relationships/
    ├── MethodCalls.{ext}             # Function calls
    ├── Imports.{ext}                 # Import statements
    └── Factories.{ext}               # Object creation
```

---

## Step 6: Write Unit Tests

**File:** `src/services/parsing/languages/{Language}Parser.test.ts`

```typescript
import { {Language}Parser } from './{Language}Parser';
import * as path from 'path';

describe('{Language}Parser', () => {
    const parser = new {Language}Parser();
    const fixturesPath = path.join(__dirname, '../../../../test-fixtures/{language}');

    describe('parseFile()', () => {
        it('should parse basic class structure', () => {
            const filePath = path.join(fixturesPath, '01-basic-classes/SimpleClass.{ext}');
            const result = parser.parseFile(filePath);

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('SimpleClass');
            expect(result[0].properties).toBeDefined();
            expect(result[0].methods).toBeDefined();
        });

        it('should extract class inheritance', () => {
            const filePath = path.join(fixturesPath, '01-basic-classes/Inheritance.{ext}');
            const result = parser.parseFile(filePath);

            const childClass = result.find(c => c.name === 'ChildClass');
            expect(childClass?.extends).toBe('ParentClass');
        });

        it('should handle parse errors gracefully', () => {
            const result = parser.parseFile('/nonexistent/file.{ext}');
            expect(result).toEqual([]);
        });
    });

    describe('extractRelationships()', () => {
        it('should detect extends relationships', () => {
            const classes = [
                { name: 'Parent', filePath: '/test/Parent.{ext}', properties: [], methods: [] },
                { name: 'Child', filePath: '/test/Child.{ext}', extends: 'Parent', properties: [], methods: [] }
            ];
            const allClassNames = new Set(['Parent', 'Child']);

            const rels = parser.extractRelationships(classes, allClassNames, '/test');

            const extendsRel = rels.find(r => r.type === 'extends');
            expect(extendsRel).toBeDefined();
            expect(extendsRel?.from).toBe('/test/Child.{ext}__Child');
            expect(extendsRel?.to).toBe('/test/Parent.{ext}__Parent');
        });

        it('should detect composition relationships', () => {
            const classes = [
                { name: 'User', filePath: '/test/User.{ext}', properties: [], methods: [] },
                { 
                    name: 'Service', 
                    filePath: '/test/Service.{ext}', 
                    properties: [{ name: 'user', type: 'User', visibility: 'private' }],
                    methods: [] 
                }
            ];
            const allClassNames = new Set(['User', 'Service']);

            const rels = parser.extractRelationships(classes, allClassNames, '/test');

            const compositionRel = rels.find(r => r.type === 'composition');
            expect(compositionRel).toBeDefined();
            expect(compositionRel?.from).toContain('Service');
            expect(compositionRel?.to).toContain('User');
        });
    });
});
```

---

## Critical Implementation Rules

### 🔴 MUST-FOLLOW Rules

1. **Always extend AbstractParserStrategy**
   ```typescript
   export class MyParser extends AbstractParserStrategy {
       // Your implementation
   }
   ```

2. **Use helper methods for relationship IDs**
   ```typescript
   // ✅ CORRECT
   const id = this.createClassId(classInfo);
   
   // ❌ WRONG
   const id = `${classInfo.filePath}__${classInfo.name}`;
   ```

3. **Use helper methods for creating relationships**
   ```typescript
   // ✅ CORRECT
   relationships.push(...this.createRelationshipsToTargets(
       classInfo, targetName, classMap, 'extends'
   ));
   
   // ❌ WRONG
   const targets = classMap.get(targetName) || [];
   targets.forEach(target => {
       relationships.push({ from: fromId, to: `${target.filePath}__${target.name}`, type: 'extends' });
   });
   ```

4. **Always use consistent ID format: `filePath__className`**
   - This prevents ambiguity when multiple files have classes with the same name
   - The helper method `createClassId()` ensures consistency

5. **Never throw errors - always return empty arrays**
   ```typescript
   try {
       // Parse logic
   } catch (error) {
       return []; // Don't crash the extension
   }
   ```

6. **Build classMap for relationship extraction**
   ```typescript
   const classMap = new Map<string, ClassInfo[]>();
   classes.forEach(cls => {
       if (!classMap.has(cls.name)) {
           classMap.set(cls.name, []);
       }
       classMap.get(cls.name)!.push(cls);
   });
   ```

### 🟡 Best Practices

1. **Extract helper methods for AST traversal**
   - Keep `parseFile()` clean and readable
   - Separate concerns: one method per extraction task

2. **Support language-specific constructs**
   - Modules, namespaces, packages
   - Traits, mixins, protocols
   - Extension methods, decorators

3. **Handle edge cases**
   - Anonymous classes
   - Nested classes
   - Generic types
   - Dynamic types

4. **Preserve line numbers**
   - Essential for code navigation
   - Store both start and end line numbers

5. **Filter out non-class types**
   - Primitives, built-ins, standard library
   - Use language-specific exclusion lists

---

## Testing Strategy

### Test Coverage Requirements

1. ✅ Basic class parsing
2. ✅ Inheritance (extends/implements)
3. ✅ Property extraction with types
4. ✅ Method extraction with parameters and return types
5. ✅ Relationship detection (all types)
6. ✅ Error handling (malformed files)
7. ✅ Edge cases (anonymous, nested, generic)

### Run Tests
```bash
npm test                                    # Run all tests
npm test -- --grep "{Language}Parser"      # Run specific parser tests
```

---

## Example: Real Parser Structure

See existing parsers for reference:

- **TypeScriptParser** - Most comprehensive, handles TS/TSX
- **JavaScriptParser** - Uses TS compiler with allowJs
- **PythonParser** - Regex-based parsing
- **PHPParser** - Uses php-parser library

**Study these patterns:**
```typescript
// 1. Helper utilities
private extractTypeNames(typeString: string): string[]
private extractProperties(node: ASTNode): PropertyInfo[]
private extractMethods(node: ASTNode): MethodInfo[]

// 2. Relationship extraction pattern
const fromId = this.createClassId(classInfo);
relationships.push(...this.createRelationshipsToTargets(...));

// 3. ClassMap usage
const classMap = new Map<string, ClassInfo[]>();
const targets = classMap.get(className) || [];
```

---

## Tips for AI Code Generation

When generating parsers for new languages, follow these guidelines:

### 1. **Understand the Language's AST**
   - Find the official parser library
   - Study AST node types for classes, methods, properties
   - Identify how inheritance and interfaces are represented

### 2. **Start with the Template**
   - Copy the template from this document
   - Replace `{Language}` and `{ext}` placeholders
   - Import the language-specific parser library

### 3. **Implement in Order**
   1. Basic class extraction
   2. Properties and methods
   3. Inheritance relationships
   4. Composition relationships
   5. Advanced relationships (imports, calls, etc.)

### 4. **Use Existing Parsers as Reference**
   - TypeScriptParser for comprehensive features
   - PythonParser for simpler, regex-based approach
   - PHPParser for external parser library integration

### 5. **Test Incrementally**
   - Write one test fixture at a time
   - Verify output manually
   - Add assertions to test suite

### 6. **Common Pitfalls to Avoid**
   - ❌ Don't hardcode ID generation
   - ❌ Don't skip the classMap creation
   - ❌ Don't throw errors on parse failures
   - ❌ Don't forget to filter out primitive types
   - ❌ Don't create relationships to non-existent classes

### 7. **Validation Checklist**
   - [ ] Extends AbstractParserStrategy
   - [ ] Uses createClassId() helper
   - [ ] Uses createRelationshipsToTargets() helper
   - [ ] Builds classMap correctly
   - [ ] Handles errors gracefully
   - [ ] Has comprehensive test coverage
   - [ ] Registered in ParserFactory
   - [ ] Updated documentation

---

## Troubleshooting

### Problem: Relationships not appearing in diagram
**Solution:** Ensure you're using the helper methods and the correct ID format
```typescript
// Check that IDs follow the pattern: filePath__className
console.log(this.createClassId(classInfo)); // Should output: "/path/file.ext__ClassName"
```

### Problem: Multiple classes with same name conflict
**Solution:** This is already handled by the `filePath__className` ID format

### Problem: Types not detected in composition
**Solution:** Improve your `extractTypeNames()` regex or parsing logic
```typescript
private extractTypeNames(typeString: string): string[] {
    // Add language-specific patterns
    // Handle generic syntax: Type<T>, Type[T], etc.
}
```

### Problem: Parser crashes on malformed files
**Solution:** Wrap parsing in try-catch and return empty array
```typescript
try {
    // Parsing logic
} catch (error) {
    return [];
}
```

---

## Additional Resources

- **Type Definitions:** `src/types/domain.ts` - ClassInfo, PropertyInfo, MethodInfo, ClassRelationship
- **Abstract Base Class:** `src/services/parsing/languages/AbstractParserStrategy.ts`
- **Factory Pattern:** `src/services/parsing/languages/ParserFactory.ts`
- **Test Examples:** `test-fixtures/` directory

---

## Summary

To add a new language parser:

1. ✅ Create `{Language}Parser.ts` extending `AbstractParserStrategy`
2. ✅ Implement `parseFile()` - extract classes using language AST
3. ✅ Implement `extractRelationships()` - use helper methods
4. ✅ Register in `ParserFactory`
5. ✅ Create test fixtures
6. ✅ Write unit tests
7. ✅ Verify all relationships are detected

**Key Principle:** Reuse existing utilities, follow established patterns, and never duplicate code.

Good luck! 🚀
