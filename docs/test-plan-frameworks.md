# Framework Enricher Test Plan

**Goal:** Visualize HTTP request flows from entry to response.

**Focus:** Request → Routing → Controller → Service → Model/DTO → View → Response

**Exclude:** Migrations, config files, build scripts, tests

---

## Test Strategy

Each framework enricher must detect and visualize the **critical HTTP path**:

```
HTTP Request
    ↓
Route Definition
    ↓
Controller/Handler
    ↓
Business Logic (Service)
    ↓
Data (Model/DTO)
    ↓
View/Response
    ↓
HTTP Response
```

---

## Framework Test Coverage

### Frontend Frameworks

#### 1. React
```
User Action → Component → Props → Child Component → Render
```
**Must detect:**
- Components (function/class)
- Component composition (A renders B)
- Props flow
- Hook usage (useState, useEffect, useContext)

**Test case:** `Button` → `Form` → `UserProfile`

---

#### 2. Next.js (Full-stack)
```
Browser → API Route → Handler → Service → DTO → JSON Response
Browser → Page → Component → getServerSideProps → Render
```
**Must detect:**
- API routes (`app/api/**/route.ts`)
- Page routes (`app/**/page.tsx`)
- Server components vs client components
- Server-side data fetching

**Test case:** `/api/users` → `UserService` → `UserDTO` → JSON

---

#### 3. Vue
```
User Action → Component → Props → Child Component → Template
```
**Must detect:**
- SFC components (.vue)
- Composition API (setup, ref, computed)
- Component composition
- Props/emits

**Test case:** `TodoList` → `TodoItem` → `TodoForm`

---

#### 4. Angular
```
HTTP → Route → Component → Service → Model → Template
```
**Must detect:**
- Components (@Component)
- Services (@Injectable)
- Dependency injection
- Route guards

**Test case:** `/users` → `UserComponent` → `UserService` → `User` → Template

---

### Backend Frameworks

#### 5. Express (Node.js)
```
GET /users → Router → Controller → Service → Model → JSON
```
**Must detect:**
- Route definitions (`app.get('/users')`)
- Middleware chain
- Controller methods
- Service calls

**Test case:** `GET /users/:id` → `UserController.show` → `UserService` → `User`

---

#### 6. NestJS (Node.js)
```
GET /users → @Controller → @Get → Service → DTO → Response
```
**Must detect:**
- Controllers (@Controller, @Get, @Post)
- Services (@Injectable)
- DTOs (class with decorators)
- Dependency injection

**Test case:** `/users` → `UserController` → `UserService` → `UserDto`

---

#### 7. Django (Python)
```
GET /users → urls.py → View → Service → Model → Serializer → JSON
```
**Must detect:**
- URL patterns (`path('users/', views.UserListView)`)
- Views (function/class-based)
- Models (Django ORM)
- Serializers (DRF)

**Test case:** `/api/users/` → `UserListView` → `User` → `UserSerializer`

---

#### 8. FastAPI (Python)
```
GET /users → @router.get → Handler → Service → Pydantic Model → JSON
```
**Must detect:**
- Route decorators (`@router.get("/users")`)
- Path operation functions
- Pydantic models (request/response)
- Dependency injection

**Test case:** `/users/{id}` → `get_user()` → `UserService` → `UserResponse`

---

#### 9. Laravel (PHP)
```
GET /users → Route → Controller → Service → Model → View/JSON
```
**Must detect:**
- Route definitions (`Route::get('/users')`)
- Controllers (methods)
- Eloquent models
- Service layer
- Blade views (if used)

**Test case:** `/users` → `UserController@index` → `User` → `users.index`

---

#### 10. Symfony (PHP)
```
GET /users → Route → Controller → Service → Entity → Twig → Response
```
**Must detect:**
- Route annotations (`#[Route('/users')]`)
- Controllers (methods)
- Services (DI container)
- Doctrine entities
- Twig templates

**Test case:** `/users/{id}` → `UserController::show` → `UserRepository` → `User`

---

## Critical Relationships to Extract

| From | To | Type | Example |
|------|-----|------|---------|
| Route | Controller | `routes-to` | `/users` → `UserController` |
| Controller | Service | `calls` | `UserController` → `UserService` |
| Service | Model | `uses` | `UserService` → `User` |
| Controller | View | `renders` | `UserController` → `users/index` |
| Component | Component | `renders` | `App` → `UserProfile` |
| Service | DTO | `returns` | `UserService` → `UserDTO` |

---

## Test Structure

```
src/test/unit/frameworks/
├── react/
│   ├── react.test.ts
│   └── fixtures/
│       ├── component-composition.tsx    (Button → Form)
│       └── hooks-usage.tsx              (useState, useEffect)
│
├── nextjs/
│   ├── nextjs.test.ts
│   └── fixtures/
│       ├── api-route.ts                 (GET /api/users)
│       └── page-component.tsx           (Server component)
│
├── django/
│   ├── django.test.ts
│   └── fixtures/
│       ├── views.py                     (UserListView)
│       ├── models.py                    (User model)
│       └── serializers.py               (UserSerializer)
│
└── laravel/
    ├── laravel.test.ts
    └── fixtures/
        ├── web.php                      (Route::get)
        ├── UserController.php
        └── User.php                     (Eloquent model)
```

---

## Success Criteria

For each framework enricher:

✅ **Detect entry points** (routes, URLs, decorators)  
✅ **Map request flow** (route → controller → service → data)  
✅ **Extract patterns** (DI, decorators, ORM usage)  
✅ **Generate relationships** (who calls whom)  
✅ **Ignore noise** (migrations, config, tests)

---

## Test Execution

**Phase 1:** Unit tests with minimal fixtures (5-10 lines each)  
**Phase 2:** Integration tests with `test-fixtures/` (full apps)  
**Phase 3:** Manual validation with real projects

**Keep it simple. Focus on the happy path. Add edge cases only when needed.**
