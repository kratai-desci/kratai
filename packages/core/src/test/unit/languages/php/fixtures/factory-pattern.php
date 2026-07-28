<?php
/**
 * Factory Pattern Test Fixture
 * Tests factory functions that create instances (new ClassName())
 */

namespace App\Factories;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;

class User {
    public string $name;
    public string $email;
    public $createdAt;
    
    public function __construct(string $name, string $email) {
        $this->name = $name;
        $this->email = $email;
        $this->createdAt = date('Y-m-d H:i:s');
    }
}

class Product {
    public string $title;
    public float $price;
    
    public function __construct(string $title, float $price) {
        $this->title = $title;
        $this->price = $price;
    }
}

class Order {
    public int $userId;
    public array $items;
    public float $total = 0;
    
    public function __construct(int $userId, array $items) {
        $this->userId = $userId;
        $this->items = $items;
    }
}

// Factory function that creates User instances
function createUser(string $name, string $email): User {
    // MUST detect: createUser creates User (new User())
    return new User($name, $email);
}

// Factory function that creates Product instances
function createProduct(string $title, float $price): Product {
    // MUST detect: createProduct creates Product (new Product())
    return new Product($title, $price);
}

// Factory with validation
function createValidatedUser(array $data): ?User {
    if (empty($data['name']) || empty($data['email'])) {
        return null;
    }
    // MUST detect: factory creates User
    return new User($data['name'], $data['email']);
}

// Factory that creates multiple instances
function createOrder(int $userId, array $productData): Order {
    $items = [];
    foreach ($productData as $data) {
        // MUST detect: createOrder creates Product
        $items[] = new Product($data['title'], $data['price']);
    }
    // MUST detect: createOrder creates Order
    return new Order($userId, $items);
}

// Builder pattern (factory-like)
class UserBuilder {
    private array $data = [];
    
    public function withName(string $name): self {
        $this->data['name'] = $name;
        return $this;
    }
    
    public function withEmail(string $email): self {
        $this->data['email'] = $email;
        return $this;
    }
    
    public function build(): User {
        // MUST detect: build creates User
        return new User($this->data['name'], $this->data['email']);
    }
}

// Factory class with static methods
class UserFactory {
    public static function create(string $name, string $email): User {
        // MUST detect: static method creates User
        return new User($name, $email);
    }
    
    public static function createFromArray(array $data): User {
        // MUST detect: static method creates User
        return new User($data['name'], $data['email']);
    }
}
