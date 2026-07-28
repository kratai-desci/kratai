<?php
/**
 * Namespaces and Use Statements Test Fixture
 * Tests namespace imports, use statements, aliasing
 */

namespace App\Controllers;

use App\Services\UserService;
use App\Services\AuthService;
use App\Models\User;
use App\Models\User as UserModel;
use App\Repositories\UserRepository;
use App\Utils\ValidationUtils;

class UserController {
    private UserService $userService;
    private AuthService $authService;
    
    public function __construct(UserService $service, AuthService $auth) {
        $this->userService = $service;
        $this->authService = $auth;
    }
    
    public function getUser(string $id): ?User {
        return $this->userService->find($id);
    }
    
    public function createUser(array $data): UserModel {
        if (ValidationUtils::validate($data)) {
            return $this->userService->create($data);
        }
        return null;
    }
}

// Multiple use statements
use function App\Utils\validateEmail;
use function App\Utils\sanitize;
use const App\Config\MAX_USERS;

function processUserData(array $data) {
    if (validateEmail($data['email'])) {
        $data['email'] = sanitize($data['email']);
        return $data;
    }
    return null;
}

// Grouped use statements
use App\Models\{User as U, Product, Order};
use App\Services\{UserService as US, ProductService};

class DataService {
    public function processUser(U $user) {
        return $user;
    }
    
    public function processProduct(Product $product) {
        return $product;
    }
}
