# Next.js Enricher Test Fixtures

These fixtures test the Next.js enricher's ability to detect framework-specific patterns.

## Fixture Files

### 1. `file-routing.ts`
**Simulates:** `app/api/users/route.ts`

**Tests:**
- File-based routing (file path → route path)
- Route handler exports (GET, POST)
- Helper functions (should NOT be detected as handlers)

**Expected Detection:**
- Route: `GET /api/users`
- Route: `POST /api/users`
- Handlers: `getUsersHandler`, `createUserHandler`

---

### 2. `api-route.ts`
**Simulates:** `app/api/users/[id]/route.ts`

**Tests:**
- Dynamic route parameters `[id]` → `:id`
- Multiple HTTP methods in same file
- Service integration (handler → service calls)
- DTO usage (service → DTO transformation)

**Expected Detection:**
- Route: `GET /api/users/:id`
- Route: `PUT /api/users/:id`
- Route: `DELETE /api/users/:id`
- Relationships: Handler → `UserService`
- Relationships: Handler → `UserDTO`

---

### 3. `page-ssr.tsx`
**Simulates:** `app/users/page.tsx`

**Tests:**
- Page component routing
- Server-side data fetching
- Service calls from page components
- Component composition (page → child components)
- Metadata exports

**Expected Detection:**
- Route: `/users` (page route)
- Component: `UsersPage`
- Relationship: `UsersPage` → `UserService.getAllUsers`
- Relationship: `UsersPage` → `UserList` (renders)

---

### 4. `server-actions.ts`
**Simulates:** Server actions file

**Tests:**
- `"use server"` directive detection
- Server action function identification
- Action → Service calls
- Cache revalidation patterns

**Expected Detection:**
- Server actions: `createUserAction`, `updateUserAction`, `deleteUserAction`
- Relationships: Action → `UserService`

---

### 5. `form-component.tsx`
**Simulates:** Client component using server actions

**Tests:**
- `"use client"` directive detection
- Form → Server action binding
- Button onClick → Server action calls
- `useFormStatus` hook usage

**Expected Detection:**
- Components: `UserForm`, `DeleteButton`
- Relationships: `UserForm` → `createUserAction` (server-action)
- Relationships: `DeleteButton` → `deleteUserAction` (server-action)

---

### 6. `middleware.ts`
**Simulates:** Root-level middleware

**Tests:**
- Middleware function detection
- Matcher configuration (which routes are protected)
- Authentication/authorization logic
- Route protection relationships

**Expected Detection:**
- Middleware: `middleware`
- Protected routes: `/api/*`, `/admin/*`, `/dashboard/*`
- Relationships: `middleware` → protected routes (middleware)

---

### 7. `layout.tsx`
**Simulates:** `app/users/layout.tsx`

**Tests:**
- Layout component detection
- Layout wrapping pages (hierarchy)
- Component composition in layouts
- Layout metadata

**Expected Detection:**
- Layout: `UsersLayout`
- Relationship: `UsersLayout` → `Header` (renders)
- Relationship: `UsersLayout` → `Sidebar` (renders)
- Relationship: `UsersLayout` → child pages (layout-wraps)

---

## Relationship Types Used

| Type | Description | Example |
|------|-------------|---------|
| `routes-to` | Route → Handler | `/api/users` → `getUsersHandler` |
| `server-action` | Component → Server Action | `UserForm` → `createUserAction` |
| `middleware` | Middleware → Protected Route | `middleware` → `/api/*` |
| `layout-wraps` | Layout → Nested Page | `RootLayout` → `UsersPage` |
| `calls` | Handler → Service | `getUsersHandler` → `UserService` |
| `renders` | Component → Component | `UsersPage` → `UserList` |
| `returns` | Handler → DTO | `getUsersHandler` → `UserDTO` |
| `http-call` | Component → API Route | `useUsers` → `GET /api/users` |

---

## Test Strategy

1. **Unit Tests (Current)**: Small fixtures focusing on specific patterns
2. **Integration Tests (Future)**: Full Next.js app structure in `test-fixtures/`
3. **Real-World Tests (Future)**: Run enricher on actual Next.js projects

---

## Running Tests

```bash
# Run all Next.js enricher tests
npm test -- --grep "NextJSEnricher"

# Run specific test suite
npm test -- --grep "File-Based Routing Detection"

# Run specific test
npm test -- --grep "should detect route handlers from file path"
```

---

## Expected Test Results (When Implemented)

```
NextJSEnricher - Framework Enrichment
  Framework Detection
    ✔ should detect Next.js from package.json
    ✔ should return correct framework name and priority
    ✔ should provide file patterns for Next.js
  
  File-Based Routing Detection
    ✔ should detect route handlers from file path
    ✔ should convert dynamic route parameters [id] to :id
    ✔ should detect page routes from app directory
    ✔ should handle nested dynamic routes
  
  Route Handler Detection
    ✔ should detect GET handler in route.ts
    ✔ should detect POST handler in route.ts
    ✔ should detect multiple handlers in same route file
  
  Server Actions Detection
    ✔ should detect "use server" directive
    ✔ should identify server action functions
    ✔ should detect server action calls from form components
    ✔ should detect server action calls from button onClick
  
  Middleware Detection
    ✔ should detect middleware.ts file
    ✔ should detect middleware matcher configuration
    ✔ should create middleware protection relationships
  
  Layout Hierarchy
    ✔ should detect layout.tsx files
    ✔ should detect layout wrapping page
    ✔ should detect nested layout hierarchy
  
  ... (more test suites)

  38 passing (total)
```
