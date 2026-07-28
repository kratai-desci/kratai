# Django Enricher Test Fixtures

Test fixtures for Django framework enricher unit tests.

## Fixtures Overview

### 1. `url-view-mapping.py`
**Purpose:** Test URL pattern detection and routing

**What it tests:**
- `path()` URL patterns
- Dynamic parameters (`<int:pk>`, `<slug:slug>`)
- Route → View relationships (`routes-to`)
- Nested routes (`include()`)
- ViewSet route mapping
- URL namespaces (`app_name`)

**Expected relationships:**
- `/users/` → `UserListView` (routes-to)
- `/users/<int:pk>/` → `UserDetailView` (routes-to)
- `/api/users/` → `UserViewSet` (routes-to)

---

### 2. `model-relationships.py`
**Purpose:** Test Django ORM model relationship detection

**What it tests:**
- Django models (`models.Model`)
- `ForeignKey` relationships (many-to-one)
- `ManyToManyField` relationships
- `OneToOneField` relationships
- Through tables for M2M relationships
- Self-referential relationships (`parent`)
- `related_name` reverse relationships

**Expected relationships:**
- `Post` → `User` (belongs-to, ForeignKey)
- `Profile` → `User` (one-to-one)
- `Post` → `Category` (many-to-many)
- `Post` → `Tag` (many-to-many, through PostTag)
- `Comment` → `Post` (belongs-to)
- `Comment` → `Comment` (self-referential)

---

### 3. `serializer-transform.py`
**Purpose:** Test Django REST Framework serializer detection

**What it tests:**
- `ModelSerializer` classes
- Serializer → Model relationships (`serializes`)
- Nested serializers
- `SerializerMethodField` usage
- Read/write serializers
- Meta class model reference

**Expected relationships:**
- `UserSerializer` → `User` (serializes)
- `PostSerializer` → `Post` (serializes)
- `PostSerializer` → `UserSerializer` (nests, for author field)
- `PostCreateSerializer` → `Post` (transforms)

---

### 4. `class-based-view.py`
**Purpose:** Test Django generic views and DRF ViewSets

**What it tests:**
- Generic views (`ListView`, `DetailView`, `CreateView`)
- DRF `ViewSet` and `ModelViewSet`
- View → Model relationships (`uses`)
- View → Serializer relationships (`uses`)
- ViewSet actions (`@action` decorator)
- Permissions (`LoginRequiredMixin`, `PermissionRequiredMixin`)
- Query filtering and optimization

**Expected relationships:**
- `UserListView` → `User` (uses model)
- `UserViewSet` → `User` (uses queryset)
- `UserViewSet` → `UserSerializer` (uses serializer_class)
- `PostViewSet` → `Post` (uses model)
- `PostViewSet` → `Category` (queries for filtering)

---

### 5. `function-based-view.py`
**Purpose:** Test function-based views (Django and DRF)

**What it tests:**
- Function-based views
- Decorators:
  - `@login_required`
  - `@permission_required`
  - `@require_http_methods`
  - `@api_view` (DRF)
  - `@permission_classes` (DRF)
- View → Model CRUD operations
- Request/response handling
- `get_object_or_404` usage

**Expected relationships:**
- `delete_user` → `User` (queries, modifies)
- `create_post` → `Post` (creates)
- `create_post` → `Category` (queries)
- `list_posts_api` → `Post` (queries)
- `list_posts_api` → `PostSerializer` (serializes)
- `add_comment` → `Comment` (creates)

---

### 6. `middleware.py`
**Purpose:** Test Django middleware detection

**What it tests:**
- Middleware classes (`MiddlewareMixin`)
- `process_request` method
- `process_response` method
- Middleware → View protection relationships
- Authentication middleware
- CORS middleware
- Logging middleware
- Security headers

**Expected relationships:**
- `CustomAuthenticationMiddleware` → all views (protected-by)
- `CORSMiddleware` → API views (protected-by)
- `SecurityHeadersMiddleware` → admin views (protected-by)

---

### 7. `permissions.py`
**Purpose:** Test DRF permission classes

**What it tests:**
- Custom permission classes (`BasePermission`)
- `has_permission` method
- `has_object_permission` method
- Permission → View usage

**Expected relationships:**
- Views using these permissions should be detected
- Ownership-based permissions
- Role-based permissions

---

## Test Coverage Matrix

| Feature | Fixture File | Test Suite Section |
|---------|--------------|-------------------|
| URL Patterns | url-view-mapping.py | URL Pattern Detection |
| ForeignKey | model-relationships.py | Model Detection |
| ManyToMany | model-relationships.py | Model Detection |
| OneToOne | model-relationships.py | Model Detection |
| ListView | class-based-view.py | View Detection |
| DetailView | class-based-view.py | View Detection |
| ViewSet | class-based-view.py | Django REST Framework |
| Serializers | serializer-transform.py | Serializer Detection |
| Nested Serializers | serializer-transform.py | Serializer Detection |
| Function Views | function-based-view.py | View Detection |
| Middleware | middleware.py | Middleware Detection |
| Permissions | permissions.py | Decorator Detection |
| Full Request Flow | All | Full Request Flow |

---

## Relationship Types

According to `test-plan-frameworks.md`, Django enricher must detect:

| From | To | Type | Fixture |
|------|-----|------|---------|
| Route | View | `routes-to` | url-view-mapping.py |
| View | Model | `uses` | class-based-view.py |
| View | Serializer | `uses` | class-based-view.py |
| Serializer | Model | `serializes` | serializer-transform.py |
| Model | Model | `belongs-to` | model-relationships.py |
| Model | Model | `many-to-many` | model-relationships.py |
| Model | Model | `one-to-one` | model-relationships.py |
| Middleware | View | `protected-by` | middleware.py |
| View | Permission | `requires` | permissions.py |

---

## Usage

These fixtures are used by the test suite at:
`src/test/unit/enrichment/django/django.test.ts`

They are **NOT** meant to be run as actual Django code. They are minimal code snippets designed to test the enricher's pattern detection capabilities.

---

## Test Philosophy

Following the test plan:
- ✅ Focus on the HTTP request flow
- ✅ Detect critical patterns (models, views, serializers)
- ✅ Ignore noise (migrations, tests, config)
- ✅ Use `filePath__className` format for relationships
- ✅ Test edge cases (empty workspace, non-Django files)
