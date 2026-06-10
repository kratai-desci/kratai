# TypeScript Test Fixtures

Comprehensive TypeScript examples testing Kratai's class diagram and sequence diagram generation.

## Available Examples

```
typescript/
├── 01-basic-classes/          ✅ Core OOP - inheritance, interfaces, generics
├── 02-react-components/       ✅ React patterns, hooks, function components
├── 03-node-backend/           ✅ Express server, middleware, REST APIs
├── 04-dependency-injection/   ✅ IoC containers, constructor injection
├── 05-design-patterns/        ✅ Singleton, Observer, Strategy, Factory
├── 06-nextjs-app/             ✅ Next.js pages, API routes, server components
└── 07-nestjs-backend/         ✅ NestJS decorators, modules, providers
```

## Parser Capabilities

The `TypeScriptParser` can detect:
- ✅ Class declarations and interfaces
- ✅ Generics (`Array<T>`, `Promise<User>`)
- ✅ Decorators (`@Injectable`, `@Component`)
- ✅ Inheritance (`extends`) and implementation (`implements`)
- ✅ Properties with type annotations
- ✅ Methods with parameters and return types
- ✅ Union and intersection types
- ✅ Constructor parameter properties
- ✅ Static members
- ✅ Abstract classes

## Scenario Details

### 01 - Basic Classes
Core TypeScript OOP features: classes, interfaces, inheritance, generics, visibility modifiers.

### 02 - React Components
React patterns: function components, hooks (useState, useEffect, custom hooks), JSX syntax, props typing.

### 03 - Node Backend
Express server architecture: routes, middleware, controllers, services, error handling.

### 04 - Dependency Injection
IoC containers, constructor injection, service registration, loose coupling patterns.

### 05 - Design Patterns
Classic patterns: Singleton (thread-safe), Observer (event system), Strategy (payment), Factory (shapes).

### 06 - Next.js App
Next.js specific patterns: page components, API routes, server/client components, dynamic routing.

### 07 - NestJS Backend
NestJS architecture: decorators, modules, providers, controllers, dependency injection via decorators.

## Testing

Run the test script:
```bash
cd /Users/nightrabbit/Documents/GitHub/kratai/mvp
node test-ts-parser.js
```

Or use VS Code extension (F5 → open this folder → Generate Class Diagram).
