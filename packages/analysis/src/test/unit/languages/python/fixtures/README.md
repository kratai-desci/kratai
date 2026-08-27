# Python Parser Test Fixtures

This directory contains test fixtures for the Python parser. Each file tests specific language patterns and relationships.

## Test Files

### `class_based.py`
Tests basic OOP patterns:
- Class definitions with constructors (`__init__`)
- Class inheritance (`class Child(Parent):`)
- Method definitions
- Property definitions (self.property)
- Multiple classes in one file

**Classes:**
- `BaseService` - Base class with validation and processing
- `UserService` - Extends BaseService, has repository dependency
- `UserRepository` - Repository pattern
- `IUserService` - Interface-like class

### `type_hints.py`
Tests type hint patterns and relationships:
- Type annotations on properties (`name: str`)
- Type annotations on parameters (`def save(user: User)`)
- Type annotations on return types (`-> User`)
- Composition relationships via type hints
- Parameter type relationships
- Return type relationships

**Classes:**
- `User` - Simple data model
- `UserDTO` - Data transfer object
- `UserRepository` - Repository with type hints
- `UserService` - Service with typed composition

### `functional.py`
Tests functional programming patterns:
- Module-level function definitions
- Function parameters with type hints
- Function return types
- Function-to-function calls
- Pure functions without classes

**Functions:**
- `validate_user()` - Validation function
- `save_user()` - Persistence function
- `create_user()` - Calls validate_user and save_user
- `update_user()` - Calls multiple functions
- `get_user()` - Data retrieval
- `delete_user()` - Data deletion
- `process_users()` - Batch processing

### `parent_calls.py`
Tests parent class method calls:
- `super().__init__()` - Parent constructor calls
- `super().method()` - Parent method calls
- Multi-level inheritance (3 levels)
- Method overriding with super calls

**Classes:**
- `BaseService` - Root base class
- `UserService(BaseService)` - First level child
- `AdminService(UserService)` - Second level child (3-level hierarchy)

### `static_methods.py`
Tests static and class methods:
- `@staticmethod` decorator
- `@classmethod` decorator
- Static method calls (`Class.method()`)
- Utility classes with only static methods

**Classes:**
- `ValidationUtils` - Utility class with static methods
- `UserService` - Service calling static methods
- `StringUtils` - Utility with class methods
- `NameFormatter` - Consumer of static methods

### `async_chains.py`
Tests async/await patterns:
- `async def` function definitions
- `await` expressions
- Async method calls
- Async class methods
- Module-level async functions

**Functions:**
- `fetch_user()` - Async data fetch
- `fetch_user_details()` - Async with await call
- `get_users()` - Multiple async calls with gather
- `process_user()` - Async chain

**Classes:**
- `AsyncUserService` - Class with async methods

### `imports.py`
Tests import patterns:
- Standard library imports (`import json`)
- Type hint imports (`from typing import Optional, List`)
- Relative imports (commented, for structure)
- Complex type hints (Optional, List, Dict)

**Classes:**
- `ImportingService` - Uses type hints from imports
- `DataProcessor` - Processes data with imports

**Functions:**
- `transform_data()` - Uses imported json module

### `decorators.py`
Tests Python decorator patterns:
- `@staticmethod` decorator
- `@classmethod` decorator
- `@property` decorator
- Custom decorators (e.g., `@router.get`)
- Methods with multiple decorators

**Classes:**
- Classes with property decorators
- Classes with static/class method decorators

### `re_exports.py`
Tests module re-export patterns:
- `from X import Y` syntax
- Re-export with alias (`from X import Y as Z`)
- `__all__` export list
- Mixed local definitions and re-exports

**Classes:**
- `ConfigService` - Local class definition

**Functions:**
- `load_config()` - Local function definition

**Patterns:**
- Re-exports specific items from other modules
- Re-exports with aliases
- Export list with `__all__`

### `factory_pattern.py`
Tests factory function patterns:
- Factory functions that create instances (`ClassName()`)
- Constructor calls detection
- Factory → Product relationships
- Builder pattern
- Static factory methods
- Class method factories

**Classes:**
- `User` - Product class created by factories
- `Product` - Product class for orders
- `Order` - Composite product class
- `UserBuilder` - Builder pattern class
- `UserFactory` - Abstract factory with static/class methods

**Functions:**
- `create_user()` - Factory that creates User
- `create_product()` - Factory that creates Product
- `create_validated_user()` - Factory with validation
- `create_order()` - Factory that creates multiple instances
- `create_user_from_type()` - Conditional factory

### `higher_order.py`
Tests higher-order function patterns:
- Functions that take functions as parameters (`Callable` type hints)
- Functions that return functions
- Callback parameters (Callable types)
- Function composition
- Currying and partial application
- Class methods with function parameters
- Decorators as higher-order functions

**Classes:**
- `DataProcessor` - Class with higher-order methods

**Functions:**
- `map_list()` - Takes callback function parameter (`Callable[[T], U]`)
- `filter_list()` - Takes predicate function parameter
- `create_multiplier()` - Returns function
- `create_greeter()` - Returns function
- `compose()` - Function composition (f ∘ g)
- `timing_decorator()` - Decorator (higher-order function)
- `process_users()` - Multiple function parameters
- `add()` - Currying example
- `partial()` - Partial application
- `fetch_data()` - Callback-based pattern

## Relationship Types Tested

### Inheritance
- **extends** - `UserService` extends `BaseService`
- **Multi-level** - `AdminService` extends `UserService` extends `BaseService`

### Composition/Usage
- **uses** - Detected from type hints on properties, parameters, and return types
- **Property types** - `repository: UserRepository`
- **Parameter types** - `def save(user: User)`
- **Return types** - `def find() -> User`

### Method Visibility
- **Public methods** - Standard method names
- **Private methods** - Methods starting with `_` or `__`

### Function Patterns
- **Module functions** - Top-level function definitions
- **Function calls** - Detected when functions call other functions
- **Static calls** - `ClassName.static_method()`

## Running Tests

```bash
# Run all tests
npm test

# Run only Python parser tests
npm test -- --grep "Python Parser"

# Run specific test suite
npm test -- --grep "Python Parser.*Phase 1"
```

## Expected Coverage

The test suite validates:
- ✅ Class parsing (constructors, methods, properties)
- ✅ Inheritance relationships (extends)
- ✅ Type hint detection (properties, parameters, returns)
- ✅ Composition relationships from type hints
- ✅ Module-level functions
- ✅ Static methods and decorators (@staticmethod, @classmethod)
- ✅ Multi-level inheritance (3 levels)
- ✅ Async/await patterns (async def, await)
- ✅ Decorator patterns (@property, custom decorators)
- ✅ Re-export patterns (from X import Y)
- ✅ Factory patterns (Constructor() calls)
- ✅ Higher-order functions (Callable type hints)
- ✅ Proper ID format (filePath__className)
- ✅ Error handling (non-existent files)
- ✅ Multiple classes per file

## Notes

1. **ID Format**: All relationship IDs follow the `filePath__className` format to prevent ambiguity
2. **Type Detection**: The parser extracts type names from type hints (`:` annotations and `->` returns)
3. **Module Functions**: Files without classes create a module representation with functions as methods
4. **Visibility**: Methods starting with `_` are marked as private
5. **Async Support**: Currently parses async functions but doesn't yet detect async-specific relationships
