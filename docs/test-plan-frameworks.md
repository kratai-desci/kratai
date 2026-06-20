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
- Props flow (parent → child data)
- Hook usage (useState, useEffect, useContext)
- Context API (Provider → Consumer)
- Custom hooks (functional composition)

**Test case:** 
- `Button` → `Form` → `UserProfile` (composition)
- `AuthContext.Provider` → `useAuth()` (context)
- `useUser(id)` → `fetchUser()` (custom hook)

---

#### 2. Next.js (Full-stack)
```
Browser → API Route → Handler → Service → DTO → JSON Response
Browser → Page → Component → getServerSideProps → Render
```
**Must detect:**
- File-based routing (`app/api/users/route.ts` = `/api/users`)
- Dynamic routes (`[id]/route.ts` = `/:id`)
- API routes (POST, GET handlers)
- Page routes (`page.tsx`)
- Server components vs client components
- Server-side data fetching (getServerSideProps, fetch in component)
- Route handlers (middleware pattern)

**Test case:** 
- `/api/users/[id]` → `UserService` → `UserDTO` (API route)
- `/users/page.tsx` → `getServerSideProps` → render (SSR)

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
GET /users → Middleware → Router → Controller → Service → Model → JSON
```
**Must detect:**
- Route definitions (`app.get('/users')`, `router.post()`)
- Middleware chain (`app.use()`, route middleware)
- Controller methods
- Service calls
- Request/response handling (`req.body`, `res.json()`)
- Error middleware

**Test case:** 
- `GET /users/:id` → `authMiddleware` → `UserController.show` → `UserService` → `User`
- Middleware chain: `auth → validate → controller`

---

#### 6. NestJS (Node.js)
```
GET /users → Guard → Controller → Service → DTO → Response
```
**Must detect:**
- Controllers (@Controller, @Get, @Post)
- Route decorators with paths
- Guards (@UseGuards) - auth/permission checks
- Interceptors (@UseInterceptors) - request/response transformation
- Services (@Injectable)
- DTOs (class with decorators)
- Dependency injection (constructor parameters)
- Exception filters (@Catch)

**Test case:** 
- `/users` → `@UseGuards(AuthGuard)` → `UserController` → `UserService` → `UserDto`
- DI: `UserController` → `UserService` (injected)

---

#### 7. Django (Python)
```
GET /users → urls.py → Middleware → View → Service → Model → Serializer → JSON
```
**Must detect:**
- URL patterns (`path('users/', views.UserListView)`)
- Views (function-based, class-based)
- Middleware (authentication, CORS)
- Models (Django ORM)
- Model relationships (ForeignKey, ManyToMany)
- Serializers (DRF) - data transformation
- Request/response (`request.POST`, `JsonResponse`)
- Permissions (DRF decorators)

**Test case:** 
- `/api/users/` → `UserListView` → `User.objects.all()` → `UserSerializer`
- Model relationship: `User` → `Post` (ForeignKey)

---

#### 8. FastAPI (Python)
```
GET /users → @router.get → Dependency → Handler → Service → Pydantic → JSON
```
**Must detect:**
- Route decorators (`@router.get("/users")`, `@app.post()`)
- Path operation functions
- Pydantic models (request/response validation)
- Dependency injection (`Depends()`)
- Path/query parameters (type hints)
- Request/response models
- Authentication dependencies (`Depends(get_current_user)`)

**Test case:** 
- `/users/{id}` → `@router.get` → `Depends(auth)` → `get_user()` → `UserService` → `UserResponse`
- Dependency chain: `get_current_user` → `verify_token`

---

#### 9. Laravel (PHP)
```
GET /users → Route → Middleware → Controller → Service → Model → View/JSON
```
**Must detect:**
- Route definitions (`Route::get('/users')`, `Route::post()`)
- Route groups with middleware
- Controllers (methods)
- Eloquent models
- Model relationships (`hasMany`, `belongsTo`, `morphMany`)
- Service layer
- Blade views (if used)
- View data flow (`view('users.index', ['users' => $users])`)
- Resource controllers (convention)
- Request validation (FormRequest)

**Test case:** 
- `/users` → `Route::get` → `auth middleware` → `UserController@index` → `User::all()` → `view`
- Model relationship: `User::posts()` → `Post` (hasMany)

---

#### 10. Symfony (PHP)
```
GET /users → Route → Controller → Service → Repository → Entity → Twig
```
**Must detect:**
- Route annotations (`#[Route('/users')]`)
- Controllers (methods)
- Services (DI container, `services.yaml`)
- Doctrine entities
- Doctrine relationships (OneToMany, ManyToOne)
- Repositories (data access)
- Twig templates
- Request/response (`Request $request`, `new JsonResponse()`)
- Security (voters, authenticators)

**Test case:** 
- `/users/{id}` → `#[Route]` → `UserController::show` → `UserRepository` → `User` → `user.html.twig`
- DI: `UserController` → `UserRepository` (injected)

---

## Critical Relationships to Extract

| From | To | Type | Example |
|------|-----|------|---------|  
| Route | Controller | `routes-to` | `/users` → `UserController` |
| Route | Middleware | `protected-by` | `/admin` → `AuthMiddleware` |
| Controller | Guard/Middleware | `uses-guard` | `@UseGuards(AuthGuard)` |
| Controller | Service | `calls` | `UserController` → `UserService` |
| Service | Model/Entity | `uses` | `UserService` → `User` |
| Model | Model | `has-many` | `User::posts()` → `Post` (ORM) |
| Model | Model | `belongs-to` | `Post::user()` → `User` (ORM) |
| Controller | View/Template | `renders` | `UserController` → `users/index` |
| Controller | DTO | `returns` | `UserController` → `UserDTO` |
| Service | DTO | `transforms` | `UserService` → `UserSerializer` |
| Component | Component | `renders` | `App` → `UserProfile` |
| Component | Context | `provides` | `AuthProvider` → `AuthContext` |
| Component | Context | `consumes` | `useContext(AuthContext)` |
| Component | Hook | `uses-hook` | `UserProfile` → `useUser()` |
| Handler | Dependency | `depends-on` | `get_user(auth: Depends())` |
| Route | Handler | `file-routing` | `/app/api/users/route.ts` → handler |
| Controller | Request | `validates` | `FormRequest` validation |
| Controller | Repository | `uses-repository` | `UserController` → `UserRepository` |

---

## Test Structure

```
src/test/unit/frameworks/
├── react/
│   ├── react.test.ts
│   └── fixtures/
│       ├── component-composition.tsx    (Button → Form)
│       ├── context-usage.tsx            (Provider → Consumer)
│       └── custom-hooks.tsx             (useUser hook)
│
├── nextjs/
│   ├── nextjs.test.ts
│   └── fixtures/
│       ├── file-routing.ts              (app/api/[id]/route.ts)
│       ├── api-route.ts                 (GET /api/users handler)
│       └── page-ssr.tsx                 (getServerSideProps)
│
├── express/
│   ├── express.test.ts
│   └── fixtures/
│       ├── middleware-chain.ts          (auth → validate → controller)
│       └── route-controller.ts          (route → controller → service)
│
├── nestjs/
│   ├── nestjs.test.ts
│   └── fixtures/
│       ├── guard-usage.ts               (@UseGuards, @UseInterceptors)
│       ├── dependency-injection.ts      (constructor DI)
│       └── dto-validation.ts            (class-validator)
│
├── django/
│   ├── django.test.ts
│   └── fixtures/
│       ├── url-view-mapping.py          (path → view)
│       ├── model-relationships.py       (ForeignKey, ManyToMany)
│       ├── serializer-transform.py      (Model → Serializer)
│       └── class-based-view.py          (ListView, DetailView)
│
├── fastapi/
│   ├── fastapi.test.ts
│   └── fixtures/
│       ├── route-decorator.py           (@router.get with dependencies)
│       ├── dependency-injection.py      (Depends() chains)
│       └── pydantic-models.py           (Request/response validation)
│
├── laravel/
│   ├── laravel.test.ts
│   └── fixtures/
│       ├── route-middleware.php         (Route::middleware())
│       ├── eloquent-relationships.php   (hasMany, belongsTo)
│       ├── resource-controller.php      (RESTful conventions)
│       └── view-data.php                (view() with data)
│
└── symfony/
    ├── symfony.test.ts
    └── fixtures/
        ├── route-annotation.php         (#[Route] decorator)
        ├── service-injection.php        (DI container)
        ├── doctrine-entity.php          (ORM relationships)
        └── repository-pattern.php       (EntityRepository)
```

---

## Success Criteria

For each framework enricher:

✅ **Detect entry points** (routes, URLs, decorators, file-based routing)  
✅ **Map request pipeline** (middleware, guards, interceptors)  
✅ **Map request flow** (route → controller → service → data → view)  
✅ **Extract framework patterns** (DI, decorators, ORM relationships, context)  
✅ **Generate relationships** (who calls whom, data flow)  
✅ **Detect conventions** (resource controllers, file routing, validation)  
✅ **Ignore noise** (migrations, config, tests, build files)

---

## Test Execution

**Phase 1:** Unit tests with minimal fixtures (5-10 lines each)  
**Phase 2:** Integration tests with `test-fixtures/` (full apps)  
**Phase 3:** Manual validation with real projects

**Keep it simple. Focus on the happy path. Add edge cases only when needed.**
