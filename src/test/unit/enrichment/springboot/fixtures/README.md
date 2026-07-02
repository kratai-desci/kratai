# Spring Boot Enricher Test Fixtures

This directory contains minimal Spring Boot code samples to test the enricher.

## Structure

- `pom.xml` - Maven config for framework detection
- `RestControllerBasic.java` - @RestController with CRUD endpoints
- `ServiceLayer.java` - @Service with business logic
- `RepositoryJpa.java` - JpaRepository interface
- `EntityBasic.java` - @Entity with basic fields
- `OneToManyRelationship.java` - User -> Posts (@OneToMany)
- `ManyToOneRelationship.java` - Post -> User (@ManyToOne)
- `ManyToManyRelationship.java` - User <-> Roles
- `ConstructorInjection.java` - DI pattern (recommended)
- `LayeredArchitecture.java` - Full Controller -> Service -> Repository -> Entity flow

## What MUST Be Detected

Each fixture has comments describing the critical patterns that the enricher MUST detect.

## Phase Implementation

- **Phase 1 (MVP):** RestController, Service, Repository, Entity, JPA relationships, DI
- **Phase 2:** Exception handling, validation, transactions
- **Phase 3:** Security, configuration, AOP
- **Phase 4:** Advanced features (caching, async, events)
