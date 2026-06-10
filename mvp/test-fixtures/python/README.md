# Python Test Fixtures

Example Python projects for testing Kratai's code visualization features.

## ✅ Python Support Now Fully Implemented!

Kratai now parses Python (`.py`) files using the `PythonParser` with full support for type hints, async/await, and modern Python patterns.

## Available Examples

```
python/
├── 01-basic-classes/          ✅ Classes, inheritance, protocols, dataclasses
├── 02-flask-components/       ✅ Flask routes, services, models, blueprints
├── 03-backend-service/        🚧 Placeholder (future)
├── 04-dependency-injection/   🚧 Placeholder (future)
├── 05-design-patterns/        ✅ Singleton, Observer, Strategy patterns
├── 06-django-app/             🚧 Placeholder (future)
└── 07-fastapi-backend/        ✅ FastAPI routes, Pydantic models, async
```

## Implemented Examples

### 01 - Basic Classes
- `animal.py` - Abstract base class with protocols (interfaces)
- `pets.py` - Dog and Cat classes extending Animal
- `pet_owner.py` - Composition example with list of pets
- **Features:** Type hints, abstract methods, protocols, property decorators

### 02 - Flask Components
- `controller.py` - Flask routes with request/response handling
- `service.py` - Business logic layer (UserService)
- `models.py` - Data models (User class)
- **Features:** Flask decorators, MVC pattern, dependency injection

### 05 - Design Patterns
- **Singleton.py** - ConfigManager with thread-safe single instance
- **Observer.py** - EventEmitter with Logger and EmailNotifier subscribers
- **Strategy.py** - Payment strategies (CreditCard, PayPal, Crypto) with context
- **Features:** Classic design patterns in Python

### 07 - FastAPI Backend
- `models.py` - Pydantic models with validation (UserCreate, UserResponse)
- `routes.py` - RESTful API endpoints with FastAPI decorators
- `service.py` - Business logic with dependency injection
- **Features:** Pydantic, async/await, FastAPI Depends(), type hints

## Parser Capabilities

The `PythonParser` can detect:
- ✅ Class declarations with line numbers
- ✅ Type hints (`def foo(x: int) -> str`)
- ✅ Constructor method (`__init__`)
- ✅ Instance attributes from `self.x = ...`
- ✅ Class attributes
- ✅ Methods (regular, static, class methods, async)
- ✅ Inheritance (single and multiple)
- ✅ Abstract base classes
- ✅ Protocols (structural subtyping)
- ✅ Decorators (`@property`, `@staticmethod`, `@abstractmethod`)
- ✅ Dependency detection from type hints

## Python-Specific Features

- **Type Hints**: Fully parsed for properties, parameters, and return types
- **Async/Await**: Async methods detected and marked
- **Dataclasses**: Automatic property extraction from `@dataclass`
- **Protocols**: Interface-like structures for duck typing
- **Multiple Inheritance**: All base classes detected
- **Magic Methods**: `__init__`, `__str__`, etc. properly extracted

## Testing

Run the test script:
```bash
cd /Users/nightrabbit/Documents/GitHub/kratai/mvp
node test-python-parser.js
```

Or use VS Code extension (F5 → open this folder → Generate Class Diagram).

## Contributing

To add more examples or complete placeholder projects:
1. Add Python files in appropriate folder
2. Include type hints for better relationship detection
3. Add line numbers (automatic with Python AST)
4. Test with Kratai to verify parsing
5. Update this README with scenario details
