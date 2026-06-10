# PHP Test Fixtures

Example PHP projects for testing Kratai's code visualization features.

## ✅ PHP Support Now Fully Implemented!

Kratai now parses PHP (`.php`) files using the `PHPParser` with full support for modern PHP 7.4+ and PHP 8.0+ features including type hints, namespaces, and traits.

## Available Examples

```
php/
├── 01-basic-classes/          ✅ Classes, interfaces, traits, abstract classes
├── 02-laravel-components/     ✅ Laravel MVC with repository pattern
├── 03-backend-service/        🚧 Placeholder (future)
├── 04-dependency-injection/   🚧 Placeholder (future)
├── 05-design-patterns/        ✅ Singleton, Observer, Strategy patterns
├── 06-symfony-app/            🚧 Placeholder (future)
└── 07-api-backend/            🚧 Placeholder (future)
```

## Implemented Examples

### 01 - Basic Classes
- `Animal.php` - Abstract class with `AnimalInterface`
- `Pets.php` - Dog and Cat classes extending Animal
- `PetOwner.php` - Composition example with array of pets
- **Features:** Abstract classes, interfaces, inheritance, visibility modifiers, type hints

### 02 - Laravel Components (⭐ Featured)
- `Models.php` - Eloquent models (User, Post) with relationships
- `UserRepository.php` - Repository pattern with `UserRepositoryInterface`
- `UserService.php` - Service layer with business logic (password hashing, validation)
- `UserController.php` - REST controller with CRUD operations
- `composer.json` - Laravel dependencies
- **Features:** MVC architecture, dependency injection, Eloquent ORM, repository pattern, PSR-4 autoloading

### 05 - Design Patterns
- **Singleton.php** - ConfigManager with single instance pattern
- **Observer.php** - EventEmitter with Logger and EmailNotifier subscribers
- **Strategy.php** - Payment strategies (CreditCard, PayPal, Crypto) with PaymentContext
- **Features:** Classic design patterns in PHP

## Parser Capabilities

The `PHPParser` can detect:
- ✅ Class declarations with namespaces
- ✅ Type hints (PHP 7.4+, 8.0+)
- ✅ Properties with type declarations
- ✅ Constructor property promotion (PHP 8.0+)
- ✅ Methods with parameters and return types
- ✅ Inheritance (`extends`)
- ✅ Interface implementation (`implements`)
- ✅ Traits (`use` statements)
- ✅ Visibility modifiers (public, private, protected)
- ✅ Static members
- ✅ Abstract classes and methods
- ✅ Nullable types (`?string`)
- ✅ Union types (PHP 8.0+)
- ✅ Dependency detection from type hints

## PHP-Specific Features

- **Type Hints**: Full support for scalar types, class types, nullable, and union types
- **Namespaces**: Properly parsed with `use` statements
- **Traits**: Detected as classes for visualization
- **Constructor Promotion**: PHP 8.0 promoted properties automatically extracted
- **Property Types**: PHP 7.4+ typed properties fully supported
- **Static Analysis**: Dependencies detected from constructor parameters and method signatures

## Laravel Architecture Highlights

The Laravel example (02-laravel-components) showcases professional backend architecture:

```
Controller → Service → Repository → Model
```

**Layered responsibilities:**
- **Controller** - HTTP requests/responses, routing
- **Service** - Business logic (validation, password hashing)
- **Repository** - Data access abstraction
- **Model** - Eloquent ORM, relationships

**Demonstrates:**
- ✅ Separation of concerns
- ✅ Constructor dependency injection
- ✅ Interface-based contracts
- ✅ PSR-4 autoloading standards
- ✅ Type-safe method signatures

## Testing

Run the test script:
```bash
cd /Users/nightrabbit/Documents/GitHub/kratai/mvp
node test-php-parser.js
```

Or use VS Code extension (F5 → open this folder → Generate Class Diagram).

## Contributing

To add more examples or complete placeholder projects:
1. Add PHP files with modern type hints (PHP 7.4+)
2. Include namespaces for realistic structure
3. Add line numbers (automatic with php-parser)
4. Test with Kratai to verify parsing
5. Consider adding:
   - Symfony examples (controllers, entities, services)
   - Standalone REST API examples
   - PSR-11 dependency injection containers
   - Laravel advanced features (jobs, events, listeners)
