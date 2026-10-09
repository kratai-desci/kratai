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
GET /tasks → urls.py → Middleware → View → Service → Model → Template → HTML
```
**Must detect:**
- URL patterns (`path('users/', views.UserListView)`)
- Views (function-based, class-based)
- Middleware (authentication, CORS)
- Models (Django ORM)
- Model relationships (ForeignKey, ManyToMany)
- Serializers (DRF) - data transformation
- Templates (HTML rendering)
- View → Template relationships (`template_name`, `render()`)
- Request/response (`request.POST`, `JsonResponse`, `render()`)
- Permissions (DRF decorators)

**Test case:** 
- `/api/users/` → `UserListView` → `User.objects.all()` → `UserSerializer` (REST API)
- `/tasks/` → `TaskListView` → `Task.objects.all()` → `task_list.html` (HTML view)
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
- Blade views/templates
- View → Template relationships (`view('users.index')`, `return view()`)
- Resource controllers (convention)
- Request validation (FormRequest)

**Test case:** 
- `/users` → `Route::get` → `auth middleware` → `UserController@index` → `User::all()` → `users/index.blade.php` (HTML view)
- `/api/users` → `Route::get` → `UserController@apiIndex` → `User::all()` → `UserResource` (JSON API)
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

#### 11. Spring Boot (Java) - COMPREHENSIVE

**REST API Flow:**
```
GET /api/users → @RestController → @Service → @Repository → @Entity → ResponseEntity<UserDTO>
```

**MVC Flow (HTML/JSP):**
```
GET /users → @Controller → @Service → @Repository → @Entity → ModelAndView → JSP/Thymeleaf
```

**Security Flow:**
```
Request → SecurityFilterChain → @PreAuthorize → Controller → Service
```

---

### Core Spring Boot Components to Detect

#### A. Controllers & Request Mapping
**Must detect:**
- `@RestController` - RESTful JSON APIs
- `@Controller` - MVC controllers returning views
- `@RequestMapping("/api/users")` - Class-level base path
- `@GetMapping("/users/{id}")` - HTTP GET with path variable
- `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`
- `@RequestParam` - Query parameters (`?name=John`)
- `@PathVariable` - URL path variables (`/users/{id}`)
- `@RequestBody` - Request payload (POST/PUT body)
- `@ResponseBody` - Return JSON (used with `@Controller`)
- `@CrossOrigin` - CORS configuration

**Test fixtures needed:**
- `RestControllerBasic.java` - Simple CRUD endpoints
- `ControllerWithView.java` - MVC returning ModelAndView
- `ControllerWithPathVariables.java` - `/users/{id}/posts/{postId}`
- `ControllerWithRequestParams.java` - `/search?q=java&page=1`

---

#### B. Service Layer
**Must detect:**
- `@Service` - Business logic layer
- `@Transactional` - Transaction boundaries
  - Read-only transactions: `@Transactional(readOnly = true)`
  - Transaction propagation: `@Transactional(propagation = Propagation.REQUIRES_NEW)`
- Method calls from controllers to services
- Method calls between services (service composition)
- Return types (DTOs, entities, primitives)

**Test fixtures needed:**
- `UserService.java` - Standard service with CRUD operations
- `TransactionalService.java` - Multiple `@Transactional` methods
- `ServiceComposition.java` - Service calling other services

---

#### C. Repository Layer (Spring Data JPA)
**Must detect:**
- `@Repository` - Data access layer marker
- `extends JpaRepository<User, Long>` - Generic repository
- `extends CrudRepository<T, ID>` - Basic CRUD operations
- Custom query methods (`findByEmailAndActiveTrue()`)
- `@Query` annotations (JPQL, native SQL)
- `@Modifying` - Update/delete queries
- `@Param` - Named query parameters
- Repository method naming conventions (findBy, countBy, deleteBy)

**Test fixtures needed:**
- `UserRepository.java` - JpaRepository with custom queries
- `CustomQueryRepository.java` - @Query with JPQL/native SQL
- `RepositoryInheritance.java` - Custom base repository

---

#### D. Entities & JPA Relationships
**Must detect:**
- `@Entity` - JPA entity marker
- `@Table(name = "users")` - Table mapping
- `@Id` - Primary key
- `@GeneratedValue(strategy = GenerationType.IDENTITY)` - Auto-increment
- `@Column(name = "email", unique = true, nullable = false)` - Column constraints

**JPA Relationships (CRITICAL):**
- `@OneToMany(mappedBy = "user", cascade = CascadeType.ALL)` 
  - User → List<Post> (one user has many posts)
- `@ManyToOne(fetch = FetchType.LAZY)`
  - Post → User (many posts belong to one user)
- `@ManyToMany(mappedBy = "users")`
  - User ↔ Role (many-to-many with join table)
- `@OneToOne(mappedBy = "user", cascade = CascadeType.ALL)`
  - User → Profile (one-to-one)
- `@JoinColumn(name = "user_id")` - Foreign key column
- `@JoinTable` - Join table for many-to-many

**Cascade & Fetch:**
- `cascade = CascadeType.ALL` - Propagate operations
- `fetch = FetchType.LAZY` - Lazy loading
- `fetch = FetchType.EAGER` - Eager loading
- `orphanRemoval = true` - Delete orphaned children

**Test fixtures needed:**
- `UserEntity.java` - Basic entity with @OneToMany posts
- `PostEntity.java` - Entity with @ManyToOne user
- `UserRoleRelationship.java` - @ManyToMany with join table
- `UserProfileOneToOne.java` - @OneToOne bidirectional
- `CascadeOperations.java` - Various cascade types
- `LazyEagerFetching.java` - Fetch strategy examples

---

#### E. DTOs & Data Transfer
**Must detect:**
- DTOs (plain Java classes for data transfer)
- `@ResponseStatus(HttpStatus.CREATED)` - HTTP status on DTOs
- DTO conversion in services/controllers
- Mapper usage (MapStruct, ModelMapper patterns)
- Builder pattern for DTOs

**Test fixtures needed:**
- `UserDTO.java` - Simple DTO
- `UserMapper.java` - Entity ↔ DTO conversion
- `NestedDTO.java` - DTO with nested objects

---

#### F. Dependency Injection (CRITICAL)
**Must detect:**
- Constructor injection (RECOMMENDED pattern):
  ```java
  public UserController(UserService userService) {
      this.userService = userService;
  }
  ```
- Field injection (legacy):
  ```java
  @Autowired
  private UserService userService;
  ```
- Setter injection:
  ```java
  @Autowired
  public void setUserService(UserService userService) {...}
  ```
- `@Autowired` (optional with constructor injection since Spring 4.3)
- `@Qualifier("beanName")` - Disambiguate multiple beans
- `@Primary` - Default bean when multiple candidates
- Injection chains (Controller → Service → Repository)

**Test fixtures needed:**
- `ConstructorInjection.java` - Recommended pattern
- `FieldInjection.java` - Legacy pattern
- `QualifierUsage.java` - Multiple implementations with @Qualifier
- `DependencyChain.java` - A → B → C → D injection

---

#### G. Validation (JSR-303/JSR-380)
**Must detect:**
- `@Valid` - Trigger validation on method parameter
- `@Validated` - Group validation
- Bean validation annotations:
  - `@NotNull`, `@NotEmpty`, `@NotBlank`
  - `@Size(min = 3, max = 50)`
  - `@Email`, `@Pattern(regexp = "...")`
  - `@Min`, `@Max`, `@DecimalMin`, `@DecimalMax`
  - `@Past`, `@Future`, `@PastOrPresent`, `@FutureOrPresent`
- Custom validators (`@CustomValidation`)
- Validation groups (`@Validated(OnCreate.class)`)
- Method-level validation (`@Validated` on class)

**Test fixtures needed:**
- `ValidatedDTO.java` - DTO with JSR-303 annotations
- `ControllerWithValidation.java` - @Valid in controller
- `CustomValidator.java` - Custom validation logic

---

#### H. Exception Handling
**Must detect:**
- `@ControllerAdvice` - Global exception handler
- `@RestControllerAdvice` - For REST APIs (auto-@ResponseBody)
- `@ExceptionHandler(UserNotFoundException.class)` - Handle specific exception
- Multiple exception handlers in one class
- Exception hierarchy (`@ExceptionHandler({Ex1.class, Ex2.class})`)
- `@ResponseStatus(HttpStatus.NOT_FOUND)` on exception classes
- Custom error responses (`ErrorResponse` DTO)
- Local exception handlers (in controller)

**Test fixtures needed:**
- `GlobalExceptionHandler.java` - @ControllerAdvice with multiple handlers
- `CustomExceptions.java` - Custom exception classes
- `ErrorResponse.java` - Standardized error DTO
- `LocalExceptionHandler.java` - Controller-level handlers

---

#### I. Configuration & Beans
**Must detect:**
- `@Configuration` - Configuration class marker
- `@Bean` - Bean factory methods
- `@ComponentScan(basePackages = "com.example")` - Package scanning
- `@EnableAutoConfiguration` - Spring Boot auto-config
- `@SpringBootApplication` - Main application class
- `@Profile("dev")` - Environment-specific beans
- `@Conditional` annotations - Conditional bean creation
- `@Value("${app.name}")` - Inject properties
- `@ConfigurationProperties(prefix = "app")` - Type-safe config
- Bean dependencies (method parameters in @Bean methods)

**Test fixtures needed:**
- `AppConfiguration.java` - @Configuration with @Bean methods
- `ProfileBasedConfig.java` - @Profile usage
- `ConditionalBeans.java` - @ConditionalOnProperty, etc.
- `ConfigurationPropertiesExample.java` - Type-safe config binding

---

#### J. Spring Security Integration
**Must detect:**
- `@EnableWebSecurity` - Enable security
- `SecurityFilterChain` bean - Filter chain configuration
- `@PreAuthorize("hasRole('ADMIN')")` - Method security
- `@PostAuthorize`, `@Secured`, `@RolesAllowed`
- `@EnableGlobalMethodSecurity` - Enable method security
- Authentication/authorization flow
- Custom authentication providers
- JWT token filters
- Security context access (`SecurityContextHolder`)

**Test fixtures needed:**
- `SecurityConfig.java` - SecurityFilterChain setup
- `MethodSecurity.java` - @PreAuthorize on methods
- `JwtAuthenticationFilter.java` - Custom security filter
- `SecuredController.java` - Controller with role checks

---

#### K. AOP (Aspect-Oriented Programming)
**Must detect:**
- `@Aspect` - Aspect class marker
- `@Before`, `@After`, `@AfterReturning`, `@AfterThrowing`, `@Around` - Advice types
- Pointcut expressions (`@Pointcut("execution(* com.example.service.*.*(..))")`)
- `@EnableAspectJAutoProxy` - Enable AOP
- Logging aspects (cross-cutting concerns)
- Performance monitoring aspects

**Test fixtures needed:**
- `LoggingAspect.java` - @Before/@After logging
- `PerformanceAspect.java` - @Around for timing
- `ExceptionAspect.java` - @AfterThrowing for error handling

---

#### L. Caching
**Must detect:**
- `@EnableCaching` - Enable caching
- `@Cacheable("users")` - Cache method result
- `@CacheEvict` - Evict cache entries
- `@CachePut` - Update cache
- `@Caching` - Multiple cache operations
- Cache configuration beans (`CacheManager`)

**Test fixtures needed:**
- `CacheConfig.java` - Cache manager setup
- `CacheableService.java` - @Cacheable methods

---

#### M. Async Processing
**Must detect:**
- `@EnableAsync` - Enable async support
- `@Async` - Async method execution
- `CompletableFuture<T>` return types
- Thread pool configuration
- Async exception handling

**Test fixtures needed:**
- `AsyncConfig.java` - Thread pool configuration
- `AsyncService.java` - @Async methods with CompletableFuture

---

#### N. Scheduled Tasks
**Must detect:**
- `@EnableScheduling` - Enable scheduling
- `@Scheduled(fixedRate = 5000)` - Fixed rate execution
- `@Scheduled(cron = "0 0 * * * *")` - Cron expressions
- `@Scheduled(fixedDelay = 1000)` - Fixed delay

**Test fixtures needed:**
- `ScheduledTasks.java` - Various @Scheduled methods

---

#### O. Events & Listeners
**Must detect:**
- `@EventListener` - Event listener method
- `ApplicationEventPublisher` - Publish events
- Custom event classes (`extends ApplicationEvent`)
- `@Async` on event listeners
- `@TransactionalEventListener` - Transaction-aware events

**Test fixtures needed:**
- `CustomEvent.java` - Event class
- `EventPublisher.java` - Publishes events
- `EventListener.java` - @EventListener methods

---

#### P. File Upload/Download
**Must detect:**
- `@RequestParam("file") MultipartFile file` - File upload
- File storage service patterns
- `ResponseEntity<Resource>` - File download
- `@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)`

**Test fixtures needed:**
- `FileUploadController.java` - Multipart file handling
- `FileStorageService.java` - File operations

---

#### Q. Pagination & Sorting
**Must detect:**
- `Pageable` parameter in repositories/controllers
- `Page<T>` return types
- `PageRequest.of(page, size, Sort.by("name"))`
- `@PageableDefault` annotation
- Sort parameter handling

**Test fixtures needed:**
- `PaginatedController.java` - Pageable endpoints
- `PaginatedRepository.java` - Page<T> queries

---

#### R. HATEOAS (Hypermedia)
**Must detect:**
- `EntityModel<T>` - Wrap entity with links
- `CollectionModel<T>` - Collection with links
- `RepresentationModelAssembler` - Convert entity to model
- Link building (`linkTo()`, `methodOn()`)

**Test fixtures needed:**
- `UserModelAssembler.java` - HATEOAS assembler
- `HateoasController.java` - Return EntityModel

---

### Relationship Types for Spring Boot

**Critical relationships to extract:**

| From | To | Type | Example |
|------|-----|------|---------|
| Controller | Service | `injects` | Constructor DI: `UserController(UserService service)` |
| Service | Repository | `injects` | Constructor DI: `UserService(UserRepository repo)` |
| Controller | Method | `calls` | `userController.getUser()` → `userService.findById()` |
| Service | Method | `calls` | `userService.create()` → `userRepository.save()` |
| Repository | Entity | `manages` | `UserRepository` manages `User` entity |
| Entity | Entity | `one-to-many` | `User.posts` → `List<Post>` (@OneToMany) |
| Entity | Entity | `many-to-one` | `Post.user` → `User` (@ManyToOne) |
| Entity | Entity | `many-to-many` | `User.roles` ↔ `Role.users` (@ManyToMany) |
| Entity | Entity | `one-to-one` | `User.profile` → `Profile` (@OneToOne) |
| Controller | DTO | `returns` | `ResponseEntity<UserDTO>` |
| Service | DTO | `transforms` | `toDTO(User entity)` |
| Service | Entity | `creates` | `new User()` instantiation |
| ControllerAdvice | Controller | `handles-exceptions-for` | Global exception handling |
| Aspect | Service | `advises` | `@Around` on service methods |
| Controller | Validator | `validates-with` | `@Valid UserDTO` |
| Config | Bean | `defines` | `@Bean SecurityFilterChain` |
| Filter | Controller | `intercepts` | Security filter chain |
| Event Publisher | Event Listener | `publishes-to` | Event → Listener |
| Controller | View | `renders` | MVC: `return "user/profile"` → JSP/Thymeleaf |

---

### Test Case Scenarios

**1. Classic REST API (CRUD):**
```
GET /api/users/{id} → 
    @GetMapping → 
    UserController.getUser(@PathVariable id) → 
    UserService.findById(id) → 
    UserRepository.findById(id) → 
    User entity → 
    UserDTO → 
    ResponseEntity<UserDTO>
```

**2. Create with Validation:**
```
POST /api/users →
    @PostMapping →
    UserController.createUser(@Valid @RequestBody UserDTO) →
    Validation (@NotBlank, @Email) →
    UserService.create(dto) →
    @Transactional →
    UserRepository.save(user) →
    User entity →
    UserDTO →
    ResponseEntity<UserDTO> (201 CREATED)
```

**3. Exception Flow:**
```
GET /api/users/999 →
    UserController →
    UserService.findById(999) →
    throws UserNotFoundException →
    @ControllerAdvice catches →
    @ExceptionHandler(UserNotFoundException.class) →
    ResponseEntity<ErrorResponse> (404 NOT FOUND)
```

**4. Security Flow:**
```
GET /api/admin/users →
    SecurityFilterChain (JWT validation) →
    @PreAuthorize("hasRole('ADMIN')") →
    AdminController.getAllUsers() →
    UserService.findAll() →
    ...
```

**5. JPA Relationships:**
```
UserService.getUserWithPosts(id) →
    UserRepository.findById(id) →
    User entity (@OneToMany posts) →
    Lazy load posts →
    List<Post> (via @ManyToOne user)
```

**6. Dependency Chain (Full Stack):**
```
UserController (injects) →
    UserService (injects) →
        UserRepository (manages) →
            User entity (@OneToMany) →
                Post entity
```

**7. Event-Driven:**
```
UserService.createUser() →
    userRepository.save() →
    eventPublisher.publishEvent(UserCreatedEvent) →
    @EventListener catches →
    EmailService.sendWelcomeEmail()
```

**8. AOP Logging:**
```
UserController.getUser() →
    @Around aspect intercepts →
    LoggingAspect.logMethodCall() →
    proceed() →
    actual method execution →
    log result
```

**9. Async Processing:**
```
OrderController.placeOrder() →
    OrderService.processOrder() →
    @Async OrderService.sendNotification() →
    CompletableFuture →
    runs in separate thread
```

**10. MVC with View:**
```
GET /users →
    @Controller UserViewController.listUsers() →
    UserService.findAll() →
    ModelAndView("user/list") →
    user/list.jsp (renders with model data)
```

---

### Test Structure for Spring Boot

```
src/test/unit/frameworks/springboot/
├── springboot.test.ts
└── fixtures/
    # Core Components
    ├── RestControllerBasic.java
    ├── ControllerWithView.java
    ├── ServiceLayer.java
    ├── RepositoryJpa.java
    ├── EntityBasic.java
    
    # Request Handling
    ├── PathVariableUsage.java
    ├── RequestParamUsage.java
    ├── RequestBodyUsage.java
    ├── ResponseEntityUsage.java
    
    # Dependency Injection
    ├── ConstructorInjection.java
    ├── FieldInjection.java
    ├── QualifierUsage.java
    ├── DependencyChain.java
    
    # JPA Relationships (CRITICAL)
    ├── OneToManyRelationship.java      (User → Posts)
    ├── ManyToOneRelationship.java      (Post → User)
    ├── ManyToManyRelationship.java     (User ↔ Roles)
    ├── OneToOneRelationship.java       (User → Profile)
    ├── CascadeOperations.java
    ├── LazyEagerFetching.java
    ├── JoinColumnUsage.java
    ├── BidirectionalRelationship.java
    
    # Validation
    ├── ValidatedDTO.java
    ├── ControllerWithValidation.java
    ├── CustomValidator.java
    ├── ValidationGroups.java
    
    # Exception Handling
    ├── GlobalExceptionHandler.java
    ├── CustomExceptions.java
    ├── ErrorResponse.java
    ├── LocalExceptionHandler.java
    
    # Configuration
    ├── AppConfiguration.java
    ├── SecurityConfig.java
    ├── ProfileBasedConfig.java
    ├── ConditionalBeans.java
    ├── ConfigurationPropertiesExample.java
    
    # Security
    ├── SecurityFilterChain.java
    ├── MethodSecurity.java
    ├── JwtAuthenticationFilter.java
    ├── SecuredController.java
    
    # AOP
    ├── LoggingAspect.java
    ├── PerformanceAspect.java
    ├── ExceptionAspect.java
    
    # Caching
    ├── CacheConfig.java
    ├── CacheableService.java
    
    # Async
    ├── AsyncConfig.java
    ├── AsyncService.java
    
    # Scheduled
    ├── ScheduledTasks.java
    
    # Events
    ├── CustomEvent.java
    ├── EventPublisher.java
    ├── EventListener.java
    ├── TransactionalEventListener.java
    
    # File Handling
    ├── FileUploadController.java
    ├── FileStorageService.java
    
    # Pagination
    ├── PaginatedController.java
    ├── PaginatedRepository.java
    
    # HATEOAS
    ├── UserModelAssembler.java
    ├── HateoasController.java
    
    # Complex Scenarios
    ├── FullCrudController.java         (All CRUD operations)
    ├── LayeredArchitecture.java        (Controller→Service→Repository→Entity)
    ├── TransactionalService.java       (Multiple @Transactional methods)
    ├── ServiceComposition.java         (Service calling other services)
    └── CompleteWorkflow.java           (End-to-end request flow)
```

---

### Success Criteria for Spring Boot Enricher

✅ **Detect all Spring Boot stereotypes** (@RestController, @Service, @Repository, @Entity, @Configuration)  
✅ **Map HTTP routes** (All @RequestMapping variants with paths)  
✅ **Extract dependency injection chains** (Constructor/field/setter injection)  
✅ **Detect JPA entity relationships** (@OneToMany, @ManyToOne, @ManyToMany, @OneToOne with cascade/fetch)  
✅ **Map layered architecture** (Controller → Service → Repository → Entity flow)  
✅ **Extract validation rules** (JSR-303 annotations on DTOs)  
✅ **Detect exception handling** (@ControllerAdvice global + local handlers)  
✅ **Map security constraints** (@PreAuthorize, SecurityFilterChain)  
✅ **Detect cross-cutting concerns** (AOP aspects, caching, async, scheduling)  
✅ **Extract configuration beans** (@Configuration, @Bean factory methods)  
✅ **Map event flows** (Publishers → Listeners)  
✅ **Detect transaction boundaries** (@Transactional with propagation)  
✅ **Handle both REST and MVC** (JSON APIs + view rendering)  
✅ **Extract DTO transformations** (Entity ↔ DTO mapping)  
✅ **Detect pagination patterns** (Pageable, Page<T>)  

---

### Priority Order for Implementation

**Phase 1 (MVP):** Core Spring Boot
1. ✅ Controllers (@RestController, @Controller)
2. ✅ Services (@Service)
3. ✅ Repositories (@Repository, JpaRepository)
4. ✅ Entities (@Entity)
5. ✅ Request mappings (All HTTP methods)
6. ✅ Dependency injection (Constructor pattern)
7. ✅ JPA relationships (All @One/@Many variants)

**Phase 2 (Essential):**
8. Exception handling (@ControllerAdvice)
9. Validation (@Valid, JSR-303)
10. DTOs and transformations
11. Transaction management (@Transactional)

**Phase 3 (Advanced):**
12. Security (@PreAuthorize, filters)
13. Configuration (@Configuration, @Bean)
14. AOP (Aspects)
15. Events (@EventListener)
16. Caching, Async, Scheduling

**Phase 4 (Complete):**
17. File handling
18. Pagination
19. HATEOAS
20. WebSocket, GraphQL (if needed)

---

## Relationship ID Format

**CRITICAL:** All relationships must use the full `filePath__className` format:

```typescript
// ✅ CORRECT:
{ from: '/path/to/UserController.ts__UserController', to: '/path/to/UserService.ts__UserService', type: 'calls' }

// ❌ WRONG:
{ from: 'UserController', to: 'UserService', type: 'calls' }
```

**Why?** Multiple files can have the same class/function name. Using just the name causes ambiguity and orphaned relationships in production.

**Framework enrichers must also follow this format when generating relationships.**

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
| Entity | Entity | `one-to-many` | `User.posts` → `Post` (JPA @OneToMany) |
| Entity | Entity | `many-to-one` | `Post.user` → `User` (JPA @ManyToOne) |
| Controller | Exception Handler | `handled-by` | `@ControllerAdvice` exception handling |

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
├── symfony/
│   ├── symfony.test.ts
│   └── fixtures/
│       ├── route-annotation.php         (#[Route] decorator)
│       ├── service-injection.php        (DI container)
│       ├── doctrine-entity.php          (ORM relationships)
│       └── repository-pattern.php       (EntityRepository)
│
└── springboot/
    ├── springboot.test.ts
    └── fixtures/
        # Core Components
        ├── RestControllerBasic.java
        ├── ControllerWithView.java
        ├── ServiceLayer.java
        ├── RepositoryJpa.java
        ├── EntityBasic.java
        
        # Request Handling
        ├── PathVariableUsage.java
        ├── RequestParamUsage.java
        ├── RequestBodyUsage.java
        ├── ResponseEntityUsage.java
        
        # Dependency Injection
        ├── ConstructorInjection.java
        ├── FieldInjection.java
        ├── QualifierUsage.java
        ├── DependencyChain.java
        
        # JPA Relationships (CRITICAL)
        ├── OneToManyRelationship.java      (User → Posts)
        ├── ManyToOneRelationship.java      (Post → User)
        ├── ManyToManyRelationship.java     (User ↔ Roles)
        ├── OneToOneRelationship.java       (User → Profile)
        ├── CascadeOperations.java
        ├── LazyEagerFetching.java
        ├── JoinColumnUsage.java
        ├── BidirectionalRelationship.java
        
        # Validation
        ├── ValidatedDTO.java
        ├── ControllerWithValidation.java
        ├── CustomValidator.java
        
        # Exception Handling
        ├── GlobalExceptionHandler.java
        ├── CustomExceptions.java
        ├── ErrorResponse.java
        
        # Configuration
        ├── AppConfiguration.java
        ├── SecurityConfig.java
        ├── ProfileBasedConfig.java
        
        # Security
        ├── SecurityFilterChain.java
        ├── MethodSecurity.java
        ├── SecuredController.java
        
        # AOP & Cross-Cutting
        ├── LoggingAspect.java
        ├── PerformanceAspect.java
        
        # Caching & Async
        ├── CacheableService.java
        ├── AsyncService.java
        ├── ScheduledTasks.java
        
        # Events
        ├── EventPublisher.java
        ├── EventListener.java
        
        # Complex Scenarios
        ├── FullCrudController.java         (All CRUD operations)
        ├── LayeredArchitecture.java        (Controller→Service→Repository→Entity)
        └── CompleteWorkflow.java           (End-to-end request flow)
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
