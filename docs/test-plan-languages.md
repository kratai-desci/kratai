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
``Type relationships (property, return, parameter types)  
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
src/test/unit/languages/typescript/
├── class-based.ts          (Classes, inheritance, interfaces)
├── functional.ts           (Functions, calls, composition)
├── type-relationships.ts   (Property/return/parameter types)
├── parent-calls.ts         (super.method() calls)
├── static-calls.ts         (Static method calls)
├── re-exports.ts           (Re-export patterns)
├── factory-pattern.ts      (Factory → Product)
├── async-chains.ts         (Async/await call chains)
├── higher-order.ts         (Callbacks, generics)
└── imports.ts              (M
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
✅ React hooks (functional pattern)  
✅ Async/await chains

**Test fixtures:**
```
src/test/unit/languages/typescript/
├─Type hints (→ type relationships)  
✅ Super calls (parent class methods)  
✅ @staticmethod + @classmethod calls  
✅ Factory patterns  
✅ Async/await (async def)  
✅ Function composition

**Test fixtures:**
```
src/test/unit/languages/python/
├── class_based.py          (Classes, inheritance)
├── functional.py           (Functions, composition)
├── type_hints.py           (Type annotations)
├── parent_calls.py         (super().method())
├── static_methods.py       (@staticmethod calls)
├── decorators.py           (@router.get, @property)
├── async_chains.py         (async def, await)
└── imports.py              (from/import patterns
✅ Type declarations (→ type relationships)  
✅ Parent calls (parent::method())  
✅ Static method calls (Class::method())  
✅ Trait usage + conflicts  
✅ Factory patterns  
✅ Array functions (array_map, etc.)

**Test fixtures:**
```
src/test/unit/languages/php/
├── class-based.php         (Classes, inheritance)
├── functional.php          (Functions, composition)
├── type-declarations.php   (Type hints)
├── parent-calls.php        (parent::method())
├── static-calls.php        (Static methods)
├── traits.php              (Trait usage, conflicts)
├── factory-pattern.php     (Factory → Product
src/test/unit/languages/python/
├── class_based.py          (UserService class)
├── functional.py           (create_user function)
├── decorators.py           (@router.get patterns)
└── imports.py              (from validators import)
```

---

### PHP
✅ Classes + methods + traits  
✅ Functions (global, namespaced)  
✅ Namespaces + use statements  
✅ Closures (anonymous functions)  
✅ Class | Class | `composition` | `private repo: UserRepository` (property) |
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
| Class | Class | `generic` | `Repository<User>`
```
src/test/unit/languages/php/
├── class-based.php         (UserService class)
├── functional.php          (create_user function)
├── traits.php              (Trait usage)
└── namespaces.php          (use statements)
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

## Key Relationships to Extract

| From | To | Type | Example |
|------|-----|------|---------|
| Class | Class | `extends` | `UserService extends BaseService` |
| Class | Interface | `implements` | `UserService implements IService` |
| Function | Function | `calls` | `createUser()` calls `validateUser()` |
| Module | Module | `imports` | `userService.ts` imports `validator.ts` |
| Class | Class | `uses` | Constructor injection |

---

## Test Structure

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

**Target:** 100% coverage of all code patterns and relationship
│       ├── class-based.ts
│       ├── functional.ts
│       ├── mixed.ts
│       └── imports.ts
├── python/
│   ├── parser.test.ts
│   └── fixtures/
│       ├── class_based.py
│       ├── functional.py
│       └── decorators.py
└── php/
    ├── parser.test.ts
    └── fixtures/
        ├── class-based.php
        ├── functional.php
        └── namespaces.php
```

---

## Test Execution

**Phase 1:** OOP patterns (classes, inheritance)  
**Phase 2:** Functional patterns (functions, calls)  
**Phase 3:** Imports (dependency graph)  
**Phase 4:** Mixed patterns (modern code)

**Target:** 100% coverage of all programming paradigms

---

## Key Insight

**Non-OOP code still has structure!**
- Functions call functions
- Modules import modules
- Composition > inheritance in modern code

The parser must capture relationships regardless of paradigm.
