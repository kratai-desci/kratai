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

## 🎯 When to Use Kratai

### Adding a New Feature?
```
1. kratai_list_diagrams → See what diagrams exist
2. Pick relevant diagram (e.g., "payment-system" for payments)
3. kratai_get_diagram(diagramId: "payment-system")
4. Extract patterns from similar classes
5. Generate code matching those patterns
```

### Debugging/Editing Code?
```
1. kratai_list_diagrams → Find diagram with your class
2. kratai_get_diagram(diagramId: "relevant-id")
3. See what depends on it, what it depends on
4. Assess impact before changing
5. Fix with full context
```

### Exploring Unfamiliar Codebase?
```
1. kratai_create_overview_diagram → Get complete picture
2. Understand layers, patterns, structure
3. Pick specific diagrams for deeper dives
```

**Key advantage:** Diagrams are generated from actual code, so they're always current (unlike docs that go stale).

---

## 🛠️ Available Tools

### kratai_list_diagrams
Lists all saved architecture diagrams.
- **Use first** to see what's available
- Returns: `[{id: "...", name: "...", lastGenerated: "..."}]`

### kratai_get_diagram(diagramId)
Gets complete architecture in markdown.
- **Use for:** Classes, methods, relationships, dependencies
- **Required:** diagramId from list
- Returns: Full markdown with all architecture details

### kratai_create_overview_diagram
Creates complete codebase overview.
- **Use when:** No diagrams exist, first time analyzing
- **Auto-detects:** Folders, languages, everything
- Returns: New diagram with complete architecture

---

## 📝 Practical Examples

### Example 1: Add PaymentService

**User asks:** "Create a PaymentService class"

```
1. kratai_list_diagrams
   → Found: ["overview", "payment-system", "services"]

2. kratai_get_diagram(diagramId: "payment-system")
   → See existing: PaymentProcessor, PaymentGateway, PaymentMethod

3. Extract pattern:
   - Location: src/services/
   - Naming: {Entity}Service
   - Structure: constructor(repo: IRepository)
   - Methods: async process{Action}()

4. Generate PaymentService matching that pattern
```

### Example 2: Debug AuthService Bug

**User asks:** "Fix authentication bug"

```
1. kratai_list_diagrams
   → Found: ["overview", "auth-system"]

2. kratai_get_diagram(diagramId: "auth-system")
   → See relationships:
     - LoginController → AuthService
     - AuthService → UserRepository
     - SessionMiddleware → AuthService

3. Impact analysis:
   - 3 classes depend on AuthService
   - Changing it affects login, sessions
   - Need to test all 3 after fix

4. Fix AuthService with full context
```

### Example 3: Refactor Large Class

**User asks:** "Split UserService, it's too big"

```
1. kratai_get_diagram(diagramId: "services")
   → UserService has 15 methods:
     - User CRUD: getUser, createUser, updateUser
     - Emails: sendWelcome, sendReset
     - Validation: validateEmail, validatePassword

2. Propose split (SRP violation):
   - Keep: User CRUD → UserService
   - Extract: Email methods → EmailService
   - Extract: Validation → UserValidator

3. Check dependencies in diagram
   - 5 controllers use UserService
   - Update them to use new services

4. Generate refactored code
```

### Example 4: Understand New Codebase

**User asks:** "How does this codebase work?"

```
1. kratai_create_overview_diagram
   → Generates complete architecture

2. kratai_get_diagram(diagramId: "overview-...")
   → See:
     - Layered architecture: Controllers → Services → Repositories
     - 45 classes in src/
     - REST API with route decorators
     - Repository pattern for data access

3. Answer with architectural insights
```

---

## 🎯 Pattern Matching Rules

When generating code, ALWAYS match existing patterns:

### Naming Conventions
- Classes: `UserService`, `ProductRepository` → `{Entity}{Type}`
- Methods: `getUser()`, `createProduct()` → `{verb}{Entity}()`
- Files: Match class names

### Folder Structure
```
src/
  controllers/  ← HTTP handlers
  services/     ← Business logic
  repositories/ ← Data access
  models/       ← Data structures
```
**Rule:** Put new code in the RIGHT folder!

### Dependency Direction
```
✅ Controllers → Services → Repositories → Models
❌ Never reverse this flow!
```

### Design Patterns
Look for patterns in diagram:
- **Repository Pattern**: `UserRepository`, `ProductRepository`
- **Service Pattern**: `AuthService`, `PaymentService`
- **Factory Pattern**: `createUser()`, `buildQuery()`

**Rule:** Follow existing patterns, don't invent new ones!

---

## ✅ Validation Checklist

Before proposing code, verify:

1. ✅ Follows naming convention from diagram?
2. ✅ In the correct folder?
3. ✅ Matches existing class patterns?
4. ✅ Respects dependency direction?
5. ✅ Single responsibility (not doing too much)?

If any ❌ → Revise!

---

## 🔄 Impact Analysis

Before modifying existing code:

```
1. kratai_get_diagram → Find the class
2. Check incoming relationships (what depends on it)
3. Check outgoing relationships (what it depends on)
4. Assess blast radius

If > 5 classes depend on it → Consider refactoring instead of direct change
```

---

## 🚨 Anti-Patterns to Flag

When reviewing diagram, watch for:

❌ **Circular Dependencies**: A → B → A  
❌ **God Classes**: > 15 methods or > 10 relationships  
❌ **Layer Violations**: Controller → Repository (skipped Service)  
❌ **Tight Coupling**: Direct dependencies on concrete classes  

If found → Propose refactoring

---

## 💡 Quick Reference

**Decision Tree:**
```
User needs code help?
  ↓
  Are diagrams available? → kratai_list_diagrams
  ├─ Yes → Pick relevant one → kratai_get_diagram(id)
  └─ No  → kratai_create_overview_diagram

  Got diagram?
  ↓
  Extract patterns → Match them in new code
```

**Remember:** 
- Diagrams show CURRENT reality (generated from code)
- Pick the SPECIFIC diagram for your task
- MATCH existing patterns (don't invent new ones)
