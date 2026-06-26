---
name: kratai-architecture-driven-development
description: Enforce architecture-aware coding using Kratai diagrams. Use when creating code, refactoring, analyzing dependencies, or discussing architecture. Ensures new code follows existing patterns and SOLID principles.
argument-hint: [file or folder]
user-invocable: true
applyTo:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.py"
  - "**/*.php"
---

# Architecture-Driven Development with Kratai

ALWAYS follow this workflow when creating or modifying code.

## 🔍 Step 1: Understand Current Architecture

Before writing ANY code:

1. **Check available diagrams:**
   ```
   kratai_list_diagrams
   ```

2. **If no diagrams exist, create one:**
   ```
   kratai_create_diagram(
     name: "architecture-analysis",
     targetFolders: ["src"] // or relevant folder
   )
   ```

3. **Get architecture:**
   ```
   kratai_get_diagram(diagramId: "architecture-analysis")
   ```

## 📋 Step 2: Analyze Existing Patterns

From the diagram, extract:

### Naming Conventions
- Classes: `UserService`, `ProductRepository` → Pattern: `{Entity}{Type}`
- Methods: `getUser()`, `createProduct()` → Pattern: `{verb}{Entity}()`
- Files: Match class names

### Folder Structure
```
src/
  services/     ← Business logic
  repositories/ ← Data access
  models/       ← Data structures
  controllers/  ← HTTP handlers
```
**Rule:** New code goes in the RIGHT folder!

### Design Patterns
Look for:
- **Repository Pattern**: `UserRepository`, `ProductRepository`
- **Service Pattern**: `AuthService`, `PaymentService`
- **Factory Pattern**: `createUser()`, `buildQuery()`
- **Strategy Pattern**: Multiple implementations of interface

**Rule:** Follow existing patterns, don't invent new ones!

### Dependency Direction
```
Controllers → Services → Repositories → Models
     ↓           ↓            ↓
  NO reverse dependencies allowed!
```

Check diagram relationships to verify layers.

## 🎯 Step 3: Apply SOLID Principles

### Single Responsibility Principle (SRP)
❌ **Bad:** `UserService` handles users, payments, emails
✅ **Good:** `UserService`, `PaymentService`, `EmailService`

**Check diagram:** If a class has > 10 methods, it probably violates SRP.

### Open/Closed Principle (OCP)
❌ **Bad:** Modify existing classes when adding features
✅ **Good:** Extend via composition or inheritance

**Check diagram:** Look for `extends` or `implements` relationships.

### Liskov Substitution Principle (LSP)
❌ **Bad:** Subclass changes parent behavior unexpectedly
✅ **Good:** Subclass enhances parent behavior

**Check diagram:** Verify `extends` relationships make sense.

### Interface Segregation Principle (ISP)
❌ **Bad:** One huge interface with 20 methods
✅ **Good:** Many small, focused interfaces

**Check diagram:** Look for interfaces with > 5 methods → split them.

### Dependency Inversion Principle (DIP)
❌ **Bad:** `UserService` depends on concrete `MySQLRepository`
✅ **Good:** `UserService` depends on `IRepository` interface

**Check diagram:** Services should depend on interfaces, not concrete classes.

## 🏗️ Step 4: Generate Consistent Code

When creating new code:

### Match Existing Structure
```typescript
// If diagram shows services like:
class UserService {
  constructor(private userRepo: IUserRepository) {}
  async getUser(id: string): Promise<User> { ... }
}

// New service MUST follow same pattern:
class ProductService {
  constructor(private productRepo: IProductRepository) {}
  async getProduct(id: string): Promise<Product> { ... }
}
```

### Respect Architectural Layers
```
✅ Controller → Service → Repository
❌ Controller → Repository (skip layer!)
❌ Repository → Service (wrong direction!)
```

### Create Proper Relationships
- **Composition:** Service HAS-A Repository
- **Inheritance:** ProductService IS-A BaseService (if pattern exists)
- **Interface:** Service IMPLEMENTS IService

**Check diagram:** Follow existing relationship patterns.

## 🚨 Step 5: Validate Against Architecture

Before proposing code, ask:

1. **Does it follow naming conventions?** (Check diagram)
2. **Is it in the right folder?** (Check folder structure)
3. **Does it match existing patterns?** (Check similar classes)
4. **Does it respect dependency direction?** (Check relationships)
5. **Does it violate SOLID?** (Analyze responsibilities)

If answer is NO → revise the code!

## 🔄 Step 6: Impact Analysis

When MODIFYING existing code, check:

```
kratai_get_diagram(id: "architecture-analysis")
```

Find the class in diagram, then check:
- **What depends on it?** (incoming relationships)
- **What does it depend on?** (outgoing relationships)
- **What would break?** (all dependent classes)

**Rule:** If > 5 classes depend on it, propose refactoring instead of direct modification.

## 📝 Example Workflows

### Workflow 1: Creating New Service

**User asks:** "Create a PaymentService"

```markdown
1. Get architecture: kratai_get_diagram
2. Analyze:
   - Found: UserService, OrderService (pattern: {Entity}Service)
   - Location: src/services/
   - Dependencies: All services have constructor(repo: IRepository)
   - Methods: async get{Entity}(), async create{Entity}()
3. Generate:
   src/services/PaymentService.ts
   - Follows naming convention
   - Uses IPaymentRepository interface
   - Matches method patterns
   - Proper error handling (same as other services)
```

### Workflow 2: Refactoring for SOLID

**User asks:** "Refactor UserService, it's too big"

```markdown
1. Get architecture: kratai_get_diagram
2. Analyze UserService:
   - Methods: getUser, createUser, sendEmail, processPayment
   - Violations: SRP (doing too many things)
3. Propose:
   - Keep: getUser, createUser in UserService
   - Extract: sendEmail → EmailService
   - Extract: processPayment → PaymentService
4. Update relationships:
   - UserService → EmailService (composition)
   - UserService → PaymentService (composition)
```

### Workflow 3: Understanding Impact

**User asks:** "What breaks if I change UserRepository?"

```markdown
1. Get architecture: kratai_get_diagram
2. Find UserRepository in diagram
3. Check relationships:
   - UserService depends on UserRepository
   - AuthService depends on UserRepository
   - AdminController depends on UserService
4. Answer: "Changing UserRepository affects:
   - UserService (direct dependency)
   - AuthService (direct dependency)
   - AdminController (indirect via UserService)
   Suggest: Add tests for these 3 classes before changing UserRepository"
```

## 🎓 Key Principles

1. **NEVER write code without checking architecture first**
2. **ALWAYS follow existing patterns**
3. **ALWAYS respect architectural layers**
4. **ALWAYS check impact before modifying**
5. **ALWAYS apply SOLID principles**

## 🚀 Advanced: Detect Anti-Patterns

From diagram, flag these issues:

❌ **Circular Dependencies:** A → B → A
❌ **God Classes:** > 15 methods or > 10 relationships
❌ **Tight Coupling:** Direct dependencies on concrete classes
❌ **Layer Violations:** Controller → Repository (skipping Service)
❌ **Missing Abstractions:** No interfaces, only concrete classes

If found, propose refactoring!

## 💡 Quick Reference

**Before creating code:**
```
1. kratai_list_diagrams
2. kratai_get_diagram(id: "...")
3. Analyze patterns
4. Generate consistent code
5. Validate against SOLID
```

**Before modifying code:**
```
1. kratai_get_diagram(id: "...")
2. Find class in diagram
3. Check dependencies (incoming/outgoing)
4. Assess impact
5. Proceed with caution
```

**When refactoring:**
```
1. kratai_get_diagram(id: "...")
2. Identify violations (SRP, DIP, etc.)
3. Propose extraction/composition
4. Verify new structure follows patterns
5. Update relationships
```
