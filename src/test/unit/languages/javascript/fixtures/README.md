# JavaScript Parser Test Fixtures

This directory contains test fixtures for the JavaScript parser. Each file tests specific language patterns and relationships.

## Test Files

### `class-based.js`
Tests basic ES6 class patterns:
- Class definitions with constructors
- Class inheritance (`class Child extends Parent`)
- Method definitions
- Property definitions (this.property)
- Multiple classes in one file
- CommonJS exports (module.exports)

**Classes:**
- `BaseService` - Base class with validation and processing
- `UserService` - Extends BaseService, has repository dependency
- `UserRepository` - Repository pattern
- `IUserService` - Interface-like class (JSDoc @interface)

### `type-relationships.js`
Tests JSDoc type annotations:
- `@typedef` for type definitions (User, UserDTO)
- `@param` for parameter types
- `@returns` for return types
- Type-based composition relationships
- Constructor parameter type hints

**Classes:**
- `UserRepository` - Repository with JSDoc type hints
- `UserService` - Service with typed constructor and methods

### `functional.js`
Tests functional programming patterns:
- Function declarations
- Function expressions
- Arrow functions
- Function-to-function calls
- Array methods (filter, map)
- Pure functions without classes

**Functions:**
- `validateUser()` - Validation function
- `saveUser()` - Persistence function
- `createUser()` - Calls validateUser and saveUser
- `updateUser()` - Calls multiple functions
- `getUser()` - Data retrieval
- `deleteUser()` - Data deletion
- `processUsers()` - Batch processing with filter/map

### `parent-calls.js`
Tests super() calls:
- `super()` constructor calls
- `super.method()` parent method calls
- Multi-level inheritance (3 levels)
- Method overriding with super calls

**Classes:**
- `BaseService` - Root base class
- `UserService(BaseService)` - First level child
- `AdminService(UserService)` - Second level child (3-level hierarchy)

### `static-calls.js`
Tests static methods:
- Static method definitions (`static methodName()`)
- Static method calls (`Class.staticMethod()`)
- Utility classes with only static methods

**Classes:**
- `ValidationUtils` - Utility class with static methods
- `UserService` - Service calling static methods
- `StringUtils` - Utility with static capitalize
- `NameFormatter` - Consumer of static methods

### `async-chains.js`
Tests async/await patterns:
- `async function` definitions
- `await` expressions
- Promise.all with multiple async calls
- Async class methods
- Module-level async functions

**Functions:**
- `fetchUser()` - Async data fetch
- `fetchUserDetails()` - Async with await call
- `getUsers()` - Multiple async calls with Promise.all
- `processUser()` - Async chain

**Classes:**
- `AsyncUserService` - Class with async methods

### `imports.js`
Tests module system:
- CommonJS require() statements
- module.exports patterns
- Built-in module imports (path, fs)
- Commented examples of relative imports

**Classes:**
- `ImportingService` - Uses type hints from imports
- `DataProcessor` - Processes data with imports

**Functions:**
- `transformData()` - Uses imported modules

## Relationship Types Tested

### Inheritance
- **extends** - `UserService` extends `BaseService`
- **Multi-level** - `AdminService` extends `UserService` extends `BaseService`

### Method Calls
- **calls-super** - super() and super.method() calls
- **calls-static** - Static method calls (ValidationUtils.validate())
- **calls** - Function-to-function calls
- **async-calls** - Await expressions

### Composition/Usage
- **composition** - Property type relationships (from JSDoc @param)
- **uses** - Detected from JSDoc type annotations

### Module System
- **imports** - CommonJS require() statements
- **exports** - module.exports patterns

## Running Tests

```bash
# Run all tests
npm test

# Run only JavaScript parser tests
npm test -- --grep "JavaScript Parser"

# Run specific test suite
npm test -- --grep "JavaScript Parser.*Phase 1"
```

## Expected Coverage

The test suite validates:
- ✅ Class parsing (constructors, methods, properties)
- ✅ Inheritance relationships (extends)
- ✅ JSDoc type hint detection (@param, @returns, @typedef)
- ✅ Composition relationships from JSDoc
- ✅ Module-level functions
- ✅ Static methods and static calls
- ✅ Super() calls to parent methods
- ✅ Multi-level inheritance (3 levels)
- ✅ Async/await patterns
- ✅ CommonJS module system (require, module.exports)
- ✅ Proper ID format (filePath__className)
- ✅ Error handling (non-existent files)
- ✅ Multiple classes per file

## Notes

1. **JSDoc Support**: JavaScript parser uses TypeScript compiler with `allowJs: true` to parse JSDoc annotations
2. **ID Format**: All relationship IDs follow the `filePath__className` format to prevent ambiguity
3. **Module Functions**: Files without classes or with top-level functions create module representations
4. **CommonJS**: Supports both `require()` and `module.exports` patterns
5. **Type Inference**: TypeScript compiler can infer some types even without JSDoc in JavaScript
6. **Arrow Functions**: Arrow functions in callbacks and assignments are detected as part of parent functions
