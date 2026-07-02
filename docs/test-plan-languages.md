# Language Parser Test Plan

**Goal:** Parse all code patterns (OOP, functional, mixed, HTTP) for comprehensive code visualization.

**Principle:** The extension must be useful whether users write OOP or functional code, and must visualize HTTP request flows.

**Exclude:** Tests, build scripts, config files

---

## HTTP Patterns (Cross-Language - Second Pass)

**Special Status:** HTTP parsing runs as a **second-pass parser** after language parsers complete.

### Why HTTP is Different:
- **Cross-language:** Works across TypeScript, Python, PHP
- **Semantic patterns:** Detects routes + calls (not just syntax)
- **Global context:** Requires full workspace to match calls to routes
- **Virtual nodes:** Creates route endpoints as diagram nodes

### 11. HTTP Route Definitions
```typescript
// TypeScript (NestJS, decorators)
@Get('/api/users')
async getUsers() { ... }

// Python (FastAPI)
@router.get('/api/users')
async def get_users(): ...

// PHP (Laravel)
Route::get('/api/users', [UserController::class, 'index']);

// Next.js (file-based routing)
// app/api/users/route.ts
export async function GET(request: Request) { ... }
```
**Must detect:** Route paths, HTTP methods, handler references

### 12. HTTP Client Calls
```typescript
// TypeScript
const users = await fetch('/api/users');
const posts = await axios.get('/api/posts');

// Python
users = requests.get('/api/users')
async with httpx.AsyncClient() as client:
    users = await client.get('/api/users')

// PHP
$users = $guzzle->get('/api/users');
$users = Http::get('/api/users');
```
**Must detect:** HTTP method, URL, calling context

### 13. Route → Handler → Service Flow
```typescript
// Client Layer
UserList.tsx: fetch('/api/users')
    ↓ http-call
// Route Layer (Virtual Node)
GET /api/users
    ↓ routes-to
// Handler Layer
UserController.getUsers()
    ↓ calls
// Service Layer
UserService.getAll()
```
**Must detect:** Full request flow visualization

### HTTP Test Fixtures
```
src/test/unit/http/            ⏳ TODO (TDD Implementation Pending)
├── parser.test.ts
└── fixtures/
    ├── decorators.ts          (NestJS @Get, @Post)
    ├── file-routing.ts        (Next.js app/api/*/route.ts)
    ├── fetch-calls.ts         (fetch, axios)
    ├── python-routes.py       (@router.get)
    ├── python-calls.py        (requests.get, httpx)
    ├── php-routes.php         (Route::get)
    └── php-calls.php          (Guzzle, Http facade)
```

**Relationship Types:**
- `http-call`: Client → Route endpoint
- `routes-to`: Route endpoint → Handler

**Note:** HTTP parser creates **route nodes** (virtual ClassInfo with `classType: 'route'`) that appear in diagrams alongside classes.

---

## HTML Template Files (Language Parser)

**Simple Job:** HTMLParser creates one ClassInfo node per `.html` file.

### 14. Template File Detection
```typescript
// For any .html file: task_list.html
{
  name: 'task_list.html',
  filePath: 'templates/task_list.html',
  classType: 'template',
  properties: [],
  methods: []
}
```
**Must detect:** Template file existence (no content parsing)

**Note:** Framework enrichers (Django, Laravel, Flask) handle:
- Detecting `render()` or `view()` calls in backend code
- Creating View → Template relationships
- Optionally parsing template inheritance (.blade.php, Jinja2)

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
src/test/unit/languages/php/        ✅ COMPLETE (147 tests - RIGOROUS)
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

### Java
⏳ Classes + methods + fields  
⏳ Interfaces + abstract classes  
⏳ Inheritance (extends) + interfaces (implements)  
⏳ Annotations (@Override, @Autowired, @Entity, etc.)  
⏳ Type relationships (field types, return types, parameter types)  
⏳ Super calls (super.method())  
⏳ Static method calls (Class.method())  
⏳ Generics (List<User>, Repository<T>)  
⏳ Factory patterns (new Operator)  
⏳ Package imports (import statements)  
⏳ Enums (enum types)  
⏳ Inner classes  
⏳ Method references (Class::method)  
⏳ Lambda expressions  
⏳ Stream API chains

**Test fixtures:**
```
src/test/unit/languages/java/        ⏳ TODO (TDD Implementation Pending)
├── parser.test.ts
└── fixtures/ (10+ files)
    ├── ClassBased.java         (Classes, inheritance)
    ├── InterfaceUsage.java     (Interface implementation)
    ├── AbstractClass.java      (Abstract classes + methods)
    ├── TypeRelationships.java  (Field/return/param types)
    ├── ParentCalls.java        (super.method())
    ├── StaticCalls.java        (Static method calls)
    ├── Annotations.java        (Spring annotations)
    ├── Generics.java           (Generic types)
    ├── FactoryPattern.java     (Factory → Product)
    ├── Enums.java              (Enum declarations)
    ├── InnerClasses.java       (Nested classes)
    ├── Lambdas.java            (Lambda expressions)
    └── Streams.java            (Stream API)
```

---

## Success Criteria

For each language parser:

✅ **Parse OOP** (classes, inheritance, interfaces)  
✅ **Parse functional** (functions, calls, composition)  
✅ **Parse imports** (build dependency graph)  
✅ **Parse mixed** (modern code uses both)  
✅ **Generate relationships** (calls, imports, uses)

For HTTP parser:

⏳ **Parse route definitions** (decorators, file-based, annotations)  
⏳ **Parse HTTP calls** (fetch, axios, requests, Guzzle)  
⏳ **Match calls to routes** (build route registry)  
⏳ **Create route nodes** (virtual ClassInfo for visualization)  
⏳ **Generate HTTP relationships** (http-call, routes-to)

For HTML parser:

⏳ **Create template nodes** (one per .html file, no content parsing)

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

**All parsers (TypeScript, Python, PHP, HTTP, HTML) must follow this format.**

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
| **Component** | **Route** | **`http-call`** | **`fetch('/api/users')`** |
| **Route** | **Handler** | **`routes-to`** | **`GET /api/users → UserController`** |
| **View** | **Template** | **`renders`** | **`render(request, 'list.html')`** |

---

## Test Structure

```
src/test/unit/
├── languages/
│   ├── typescript/
│   │   ├── parser.test.ts
│   │   └── fixtures/
│   │       ├── class-based.ts
│   │       ├── functional.ts
│   │       ├── type-relationships.ts
│   │       ├── parent-calls.ts
│   │       ├── static-calls.ts
│   │       ├── re-exports.ts
│   │       ├── factory-pattern.ts
│   │       ├── async-chains.ts
│   │       ├── higher-order.ts
│   │       └── imports.ts
│   ├── python/
│   │   ├── parser.test.ts
│   │   └── fixtures/
│   │       ├── class_based.py
│   │       ├── functional.py
│   │       ├── type_hints.py
│   │       ├── parent_calls.py
│   │       ├── static_methods.py
│   │       ├── decorators.py
│   │       ├── async_chains.py
│   │       └── imports.py
│   └── php/
│       ├── parser.test.ts
│       └── fixtures/
│           ├── class-based.php
│           ├── functional.php
│           ├── type-declarations.php
│           ├── parent-calls.php
│           ├── static-calls.php
│           ├── traits.php
│           ├── factory-pattern.php
│           └── namespaces.php
└── http/                          ⏳ TODO
    ├── parser.test.ts
    └── fixtures/
        ├── decorators.ts
        ├── file-routing.ts
        ├── fetch-calls.ts
        ├── python-routes.py
        ├── python-calls.py
        ├── php-routes.php
        └── php-calls.php
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

**Phase 6:** HTTP patterns (Second Pass)
- Route definitions
- HTTP client calls
- Call-to-route matching
- Route nodes creation

**Target:** 100% coverage of all code patterns and relationships

---

## Key Insight

**Non-OOP code still has structure!**
- Functions call functions
- Modules import modules
- Composition > inheritance in modern code
- HTTP requests connect frontend to backend

The parser must capture relationships regardless of paradigm.
