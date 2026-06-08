# Python Test Fixtures

Example Python projects for testing Kratai's code visualization features (when Python support is added).

## Available Examples

```
python/
├── 01-basic-classes/          ✅ Classes, inheritance, protocols
├── 02-flask-components/       ✅ Flask routes, services, models
├── 03-backend-service/        🚧 Placeholder
├── 04-dependency-injection/   🚧 Placeholder
├── 05-design-patterns/        ✅ Singleton, Observer, Strategy
├── 06-django-app/             🚧 Placeholder
└── 07-fastapi-backend/        ✅ FastAPI routes, Pydantic models
```

## Implemented Examples

### 01 - Basic Classes
- Abstract base classes
- Class inheritance (Dog, Cat extend Animal)
- Protocols (interfaces)
- Properties and type hints

### 02 - Flask Components
- Flask controller with routes
- Service layer with business logic
- Data models (User)
- MVC pattern

### 05 - Design Patterns
- **Singleton**: ConfigManager with single instance
- **Observer**: EventEmitter with Logger and EmailNotifier
- **Strategy**: Payment strategies (CreditCard, PayPal, Crypto)

### 07 - FastAPI Backend
- Pydantic models with validation
- RESTful API routes
- Service layer
- Dependency injection with Depends()

## Python Support Status

🚧 **Python language support is planned for a future release.**

Currently only TypeScript is supported. These fixtures are ready for when Python parsing is implemented.

## Contributing

To add more examples or complete the placeholder projects, submit a PR with working Python code demonstrating specific patterns or frameworks.
