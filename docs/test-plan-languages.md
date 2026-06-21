# Language Parser Test Plan

**Goal:** Parse all code patterns (OOP, functional, mixed) for comprehensive code visualization.

**Principle:** The extension must be useful whether users write OOP or functional code.

**Exclude:** Tests, build scripts, config files

---

## Critical Patterns to Support

### 1. Object-Oriented Programming
```typescript
class UserService {
  constructor(private repo: UserRepository) {}
  getUser(id: string) { return this.repo.find(id); }
}
```
**Must detect:** Classes, methods, properties, inheritance, DI

### 2. Functional Programming
```typescript
export function createUser(data) {
  return validateUser(data) ? saveUser(data) : null;
}
```
**Must detect:** Functions, function calls, module exports

### 3. Module Imports/Exports
```typescript
import { validateUser } from './validators';
export { createUser, updateUser };
```
**Must detect:** Import sources, exported items, dependency graph

### 4. Type Relationships
```typescript
class UserService {
  private repo: UserRepository;           // Property type (composition)
  getUsers(): User[] { ... }              // Return type
  create(data: UserDTO): Promise<User> {  // Parameter + return type
    return this.repo.save(data);
  }
}
```
**Must detect:** Property types, return types, parameter types, composition

### 5. Parent Class Calls
```typescript
class UserService extends BaseService {
  override save(data: User) {
    super.validate(data);  // ← Call to parent method
    return super.save(data);
  }
}
```
**Must detect:** Super calls, method overrides, parent-child relationships

### 6. Static Method Calls
```typescript
class ValidationUtils {
  static validate(data) { ... }
}
const result = ValidationUtils.validate(data);  // Static call
```
**Must detect:** Static method calls across classes

### 7. Re-exports (Module Graph)
```typescript
// index.ts
export { UserService } from './services/UserService';
export * from './models';
```
**Must detect:** Re-exported items, transitive dependencies

### 8. Factory Patterns
```typescript
function createUser(data): User {
  return new User(data);  // Factory creates instance
}
```
**Must detect:** Factory → Product relationships, constructor calls

### 9. Async Chains
```typescript
async function getUser(id: string) {
  const data = await fetchUser(id);     // Async call
  return await transformUser(data);     // Chain
}
```
**Must detect:** Async function calls, promise chains

### 10. Higher-Order Functions
```typescript
function map<T, U>(items: T[], fn: (item: T) => U): U[] { ... }
users.map(user => user.name);  // Callback function
```
**Must detect:** Function parameters, callback types, generics

---

## Language-Specific Tests

### TypeScript/JavaScript
✅ Classes + methods + properties  
✅ Functions (arrow, named, exported)  
✅ Imports (named, default, namespace)  
✅ Function calls between modules  
✅ Type relationships (property, return, parameter types)  
✅ Super calls (parent class methods)  
✅ Static method calls  
✅ Re-exports (module graph)  
✅ Factory patterns  
✅ Async/await chains  
✅ Higher-order functions + callbacks  
✅ Generics  
✅ Abstract classes

**Test fixtures:**
```
src/test/unit/languages/
├── typescript/                  ✅ COMPLETE (19 tests)
│   ├── parser.test.ts
│   └── fixtures/ (10 files)
└── javascript/                  ✅ COMPLETE (41 tests - RIGOROUS)
    ├── parser.test.ts
    └── fixtures/ (10 files)
        ├── class-based.js
        ├── functional.js
        ├── type-relationships.js (JSDoc)
        ├── parent-calls.js
        ├── static-calls.js
        ├── async-chains.js
        ├── imports.js
        ├── re-exports.js           ✅ NEW
        ├── factory-pattern.js      ✅ NEW
        └── higher-order.js         ✅ NEW
```

---

### Python
✅ Classes + methods  
✅ Functions (def, lambda)  
✅ Imports (from/import)  
✅ Decorators (@staticmethod, @property)  
✅ Type hints (→ type relationships)  
✅ Super calls (parent class methods)  
✅ @staticmethod + @classmethod calls  
✅ Factory patterns  
✅ Async/await (async def)  
✅ Function composition

**Test fixtures:**
```
src/test/unit/languages/python/        ✅ COMPLETE (51 tests - RIGOROUS)
├── parser.test.ts
└── fixtures/ (11 files)
    ├── class_based.py          (Classes, inheritance)
    ├── functional.py           (Functions, composition)
    ├── type_hints.py           (Type annotations)
    ├── parent_calls.py         (super().method())
    ├── static_methods.py       (@staticmethod calls)
    ├── decorators.py           (@router.get, @property)
    ├── async_chains.py         (async def, await)
    ├── imports.py              (from/import patterns)
    ├── re_exports.py           ✅ NEW
    ├── factory_pattern.py      ✅ NEW
    └── higher_order.py         ✅ NEW
```

---

### PHP
✅ Classes + methods + traits  
✅ Functions (global, namespaced)  
✅ Namespaces + use statements  
✅ Closures (anonymous functions)  
✅ Type declarations (→ type relationships)  
✅ Parent calls (parent::method())  
✅ Static method calls (Class::method())  
✅ Trait usage + conflicts  
✅ Factory patterns  
✅ Array functions (array_map, etc.)  
✅ Higher-order functions (callable)  
✅ Re-export patterns (aliasing)

**Test fixtures:**
```
src/test/unit/languages/php/        ✅ COMPLETE (TBD tests - RIGOROUS)
├── parser.test.ts
└── fixtures/ (12 files)
    ├── class-based.php         (Classes, inheritance)
    ├── functional.php          (Functions, composition)
    ├── type-declarations.php   (Type hints)
    ├── parent-calls.php        (parent::method())
    ├── static-calls.php        (Static methods)
    ├── traits.php              (Trait usage, conflicts)
    ├── factory-pattern.php     (Factory → Product)
    ├── namespaces.php          (use statements)
    ├── higher-order.php        ✅ NEW
    ├── re-exports.php          ✅ NEW
    ├── empty.php               (Edge case)
    └── comments-only.php       (Edge case)
```

---

## Success Criteria

For each language parser:

✅ **Parse OOP** (classes, inheritance, interfaces)  
✅ **Parse functional** (functions, calls, composition)  
✅ **Parse imports** (build dependency graph)  
✅ **Parse mixed** (modern code uses both)  
✅ **Generate relationships** (calls, imports, uses)

---

## Relationship ID Format

**CRITICAL:** All relationships must use the full `filePath__className` format:

```typescript
// ✅ CORRECT:
{ from: '/path/to/file.ts__UserService', to: '/path/to/file.ts__BaseService', type: 'extends' }

// ❌ WRONG:
{ from: 'UserService', to: 'BaseService', type: 'extends' }
```

**Why?** Multiple files can have the same class name (e.g., `User` in `models/User.ts` and `dtos/User.ts`). Using just the class name causes ambiguity and orphaned relationships in production.

**Test assertions must verify the full format:**
```typescript
// ✅ CORRECT test:
const rel = relationships.find(r => 
  r.from === `${fixturePath}__UserService` && 
  r.to === `${fixturePath}__BaseService`
);

// ❌ WRONG test (will pass but doesn't catch production bugs):
const rel = relationships.find(r => 
  r.from === 'UserService' && r.to === 'BaseService'
);
```

**All language parsers (TypeScript, Python, PHP) must follow this format.**

---

## Key Relationships to Extract

| From | To | Type | Example |
|------|-----|------|---------|  
| Class | Class | `extends` | `UserService extends BaseService` |
| Class | Interface | `implements` | `UserService implements IService` |
| Class | Class | `composition` | `private repo: UserRepository` (property) |
| Method | Class | `returns` | `getUser(): User` (return type) |
| Method | Class | `parameter` | `create(data: UserDTO)` (param type) |
| Method | Method (parent) | `calls-super` | `super.validate(data)` |
| Class | Class (static) | `calls-static` | `ValidationUtils.validate()` |
| Function | Function | `calls` | `createUser()` calls `validateUser()` |
| Function | Class | `creates` | `new User(data)` (factory) |
| Function | Class | `returns` | Factory returns type |
| Module | Module | `imports` | `import { User } from './models'` |
| Module | Module | `re-exports` | `export { User } from './models'` |
| Function | Function | `async-calls` | `await fetchUser()` |
| Function | Function | `callback` | `users.map(fn)` (higher-order) |
| Class | Class | `generic` | `Repository<User>` |

---

## Test Structure

```
src/test/unit/languages/
├── typescript/
│   ├── parser.test.ts
│   └── fixtures/
│       ├── class-based.ts
│       ├── functional.ts
│       ├── type-relationships.ts
│       ├── parent-calls.ts
│       ├── static-calls.ts
│       ├── re-exports.ts
│       ├── factory-pattern.ts
│       ├── async-chains.ts
│       ├── higher-order.ts
│       └── imports.ts
├── python/
│   ├── parser.test.ts
│   └── fixtures/
│       ├── class_based.py
│       ├── functional.py
│       ├── type_hints.py
│       ├── parent_calls.py
│       ├── static_methods.py
│       ├── decorators.py
│       ├── async_chains.py
│       └── imports.py
└── php/
    ├── parser.test.ts
    └── fixtures/
        ├── class-based.php
        ├── functional.php
        ├── type-declarations.php
        ├── parent-calls.php
        ├── static-calls.php
        ├── traits.php
        ├── factory-pattern.php
        └── namespaces.php
```

---

## Test Execution

**Phase 1:** OOP patterns
- Classes, inheritance, interfaces
- Abstract classes
- Super calls (parent methods)

**Phase 2:** Type relationships
- Property types (composition)
- Return types
- Parameter types
- Generics

**Phase 3:** Method calls
- Instance method calls
- Static method calls
- Super calls
- Async chains

**Phase 4:** Functional patterns
- Functions, composition
- Higher-order functions
- Callbacks
- Factory patterns

**Phase 5:** Module graph
- Imports
- Exports
- Re-exports
- Transitive dependencies

**Target:** 100% coverage of all code patterns and relationships

---

## Key Insight

**Non-OOP code still has structure!**
- Functions call functions
- Modules import modules
- Composition > inheritance in modern code

The parser must capture relationships regardless of paradigm.
