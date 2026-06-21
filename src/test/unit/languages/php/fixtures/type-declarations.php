<?php
/**
 * Type Declarations Test Fixture
 * Tests type hints for parameters, return types, properties
 */

namespace App\Models;

class User {
    public string $name;
    public string $email;
    public ?int $age = null;
    
    public function __construct(string $name, string $email) {
        $this->name = $name;
        $this->email = $email;
    }
}

class UserDTO {
    public string $name;
    public string $email;
}

class UserRepository {
    private array $users = [];
    
    public function find(string $id): ?User {
        return $this->users[$id] ?? null;
    }
    
    public function save(User $user): User {
        $this->users[$user->email] = $user;
        return $user;
    }
    
    public function findAll(): array {
        return $this->users;
    }
}

class UserService {
    private UserRepository $repository;
    
    public function __construct(UserRepository $repository) {
        $this->repository = $repository;
    }
    
    public function getUser(string $id): ?User {
        return $this->repository->find($id);
    }
    
    public function createFromDTO(UserDTO $dto): User {
        $user = new User($dto->name, $dto->email);
        return $this->repository->save($user);
    }
    
    public function getUsers(): array {
        return $this->repository->findAll();
    }
}
