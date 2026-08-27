<?php
/**
 * Traits Test Fixture
 * Tests trait usage, trait conflicts, trait methods
 */

namespace App\Traits;

trait Timestampable {
    protected $createdAt;
    protected $updatedAt;
    
    public function touch() {
        $this->updatedAt = date('Y-m-d H:i:s');
    }
    
    public function getCreatedAt() {
        return $this->createdAt;
    }
}

trait SoftDeletable {
    protected $deletedAt;
    
    public function delete() {
        $this->deletedAt = date('Y-m-d H:i:s');
    }
    
    public function restore() {
        $this->deletedAt = null;
    }
    
    public function isDeleted(): bool {
        return $this->deletedAt !== null;
    }
}

trait Loggable {
    protected $logs = [];
    
    public function log(string $message) {
        $this->logs[] = ['time' => date('Y-m-d H:i:s'), 'message' => $message];
    }
    
    public function getLogs(): array {
        return $this->logs;
    }
}

class User {
    use Timestampable, SoftDeletable;
    
    public $name;
    public $email;
    
    public function __construct(string $name, string $email) {
        $this->name = $name;
        $this->email = $email;
        $this->createdAt = date('Y-m-d H:i:s');
    }
    
    public function save() {
        $this->touch();
    }
}

class Article {
    use Timestampable, SoftDeletable, Loggable;
    
    public $title;
    
    public function __construct(string $title) {
        $this->title = $title;
        $this->createdAt = date('Y-m-d H:i:s');
        $this->log('Article created');
    }
}

// Trait conflict resolution
trait A {
    public function hello() {
        return 'Hello from A';
    }
}

trait B {
    public function hello() {
        return 'Hello from B';
    }
}

class Greeting {
    use A, B {
        B::hello insteadof A;
        A::hello as helloA;
    }
}
