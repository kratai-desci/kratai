# PHP Parser Test Fixtures

This directory contains test fixtures for the PHP parser. Each file tests specific language patterns and relationships.

## Test Files

### `class-based.php`
Tests basic OOP patterns:
- Class definitions with constructors
- Class inheritance (`class Child extends Parent`)
- Method definitions
- Property definitions ($this->property)
- Interfaces
- Abstract classes
- Multiple classes in one file

**Classes:**
- `BaseService` - Base class with validation
- `UserRepository` - Repository pattern
- `UserService` - Extends BaseService, has repository dependency
- `IUserService` - Interface
- `AbstractService` - Abstract class

### `type-declarations.php`
Tests PHP 7+ type hints:
- Property type declarations (`public string $name`)
- Parameter type hints (`function find(string $id)`)
- Return type declarations (`: ?User`, `: array`)
- Nullable types (`?int`)
- Composition relationships via type hints

**Classes:**
- `User` - Simple model with typed properties
- `UserDTO` - Data transfer object
- `UserRepository` - Repository with type hints
- `UserService` - Service with typed composition

### `functional.php`
Tests functional programming patterns:
- Function definitions
- Function-to-function calls
- Closures/anonymous functions
- Higher-order functions (array_filter, array_map)

**Functions:**
- `validateUser()` - Validation function
- `saveUser()` - Persistence function
- `createUser()` - Calls validateUser and saveUser
- `updateUser()` - Calls multiple functions
- `processUsers()` - Uses array_filter with callbacks

### `parent-calls.php`
Tests parent class method calls:
- `parent::__construct()` - Parent constructor calls
- `parent::method()` - Parent method calls
- Multi-level inheritance (3 levels)
- Method overriding with parent calls

**Classes:**
- `BaseService` - Root base class
- `UserService(BaseService)` - First level child
- `AdminService(UserService)` - Second level child (3-level hierarchy)

### `static-calls.php`
Tests static method patterns:
- Static method definitions
- Static method calls (`Class::method()`)
- Utility classes with only static methods

**Classes:**
- `ValidationUtils` - Utility class with static methods
- `StringUtils` - String utility methods
- `UserService` - Service calling static methods
- `NameFormatter` - Consumer of static methods

### `traits.php`
Tests PHP trait patterns:
- Trait definitions
- Trait usage (`use TraitName`)
- Multiple traits
- Trait conflict resolution (`insteadof`, `as`)
- Trait method access

**Traits:**
- `Timestampable` - Timestamp tracking
- `SoftDeletable` - Soft delete functionality
- `Loggable` - Logging functionality

**Classes:**
- `User` - Uses Timestampable, SoftDeletable
- `Article` - Uses all three traits
- `Greeting` - Demonstrates trait conflict resolution

### `factory-pattern.php`
Tests factory function patterns:
- Factory functions that create instances (`new ClassName()`)
- Constructor calls detection
- Factory → Product relationships
- Builder pattern
- Static factory methods

**Classes:**
- `User` - Product class created by factories
- `Product` - Product class for orders
- `Order` - Composite product class
- `UserBuilder` - Builder pattern class
- `UserFactory` - Factory class with static methods

**Functions:**
- `createUser()` - Factory that creates User
- `createProduct()` - Factory that creates Product
- `createValidatedUser()` - Factory with validation
- `createOrder()` - Factory that creates multiple instances

### `namespaces.php`
Tests namespace and import patterns:
- Namespace declarations
- `use` statements (imports)
- Class aliasing (`use X as Y`)
- Grouped use statements
- Function and constant imports
- Type hint imports

**Classes:**
- `UserController` - Uses multiple imported classes
- `DataService` - Uses grouped imports

### `higher-order.php`
Tests higher-order function patterns:
- Functions that take functions as parameters (`callable` type hint)
- Functions that return functions (closures)
- Callback parameters
- Function composition
- Currying and closures
- Class methods with function parameters

**Classes:**
- `DataProcessor` - Class with higher-order methods

**Functions:**
- `map()` - Takes callback function parameter
- `filter()` - Takes predicate function parameter
- `createMultiplier()` - Returns function (closure)
- `createGreeter()` - Returns function
- `compose()` - Function composition (f ∘ g)
- `processUsers()` - Multiple function parameters
- `add()` - Currying example

### `re-exports.php`
Tests PHP's equivalent of re-export patterns:
- Class aliasing/extending for public API
- Namespace forwarding (facade pattern)
- Class inheritance as re-export mechanism

**Classes:**
- `UserService` - Re-exported via extension
- `ValidationUtils` - Re-exported utility
- `ConfigService` - Local class definition
- `User` (facade) - Static facade pattern

## Relationship Types Tested

### Inheritance
- **extends** - `UserService extends BaseService`
- **Multi-level** - `AdminService extends UserService extends BaseService`

### Traits
- **uses** - `use Timestampable`
- **Multiple traits** - `use A, B, C`
- **Conflict resolution** - `use A, B { B::method insteadof A }`

### Composition/Usage
- **Property types** - `private UserRepository $repository`
- **Parameter types** - `function save(User $user)`
- **Return types** - `function find(string $id): ?User`

### Method Calls
- **parent calls** - `parent::method()`
- **static calls** - `ValidationUtils::validate()`
- **function calls** - `createUser()` calls `validateUser()`

### Module System
- **imports** - `use App\Services\UserService`
- **aliasing** - `use App\Models\User as UserModel`
- **grouped** - `use App\Models\{User, Product}`

## Running Tests

```bash
# Run all tests
npm test

# Run only PHP parser tests
npm test -- --grep "PHP Parser"

# Run specific test suite
npm test -- --grep "PHP Parser.*Phase 1"
```

## Expected Coverage

The test suite validates:
- ✅ Class parsing (constructors, methods, properties)
- ✅ Inheritance relationships (extends)
- ✅ Trait usage and conflicts
- ✅ Type hint detection (properties, parameters, returns)
- ✅ Composition relationships from type hints
- ✅ Namespace and use statements
- ✅ Static methods and static calls
- ✅ Parent calls (parent::method())
- ✅ Multi-level inheritance (3 levels)
- ✅ Factory patterns (new Constructor())
- ✅ Higher-order functions (callable parameters)
- ✅ Proper ID format (filePath__className)
- ✅ Error handling (non-existent files)
- ✅ Multiple classes per file

## Notes

1. **Type Hints**: PHP 7+ type hints are used for relationship detection
2. **ID Format**: All relationship IDs follow the `filePath__className` format
3. **Traits**: PHP traits are tracked as a special relationship type
4. **Namespaces**: Full namespace paths are preserved
5. **Callable**: PHP uses `callable` type hint for function parameters
6. **Static Methods**: Detected via `Class::method()` syntax
7. **Parent Calls**: Detected via `parent::method()` syntax
