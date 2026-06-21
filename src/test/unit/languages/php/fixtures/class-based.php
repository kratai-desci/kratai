<?php
/**
 * Class-Based PHP Test Fixture
 * Tests basic OOP patterns: classes, inheritance, methods, properties
 */

namespace App\Services;

class BaseService {
    protected $name;
    protected $logger;
    
    public function __construct($name) {
        $this->name = $name;
    }
    
    public function validate($data) {
        return !empty($data);
    }
    
    protected function log($message) {
        echo "LOG: $message";
    }
}

class UserRepository {
    private $users = [];
    
    public function find($id) {
        return $this->users[$id] ?? null;
    }
    
    public function save($user) {
        $this->users[$user->id] = $user;
        return $user;
    }
    
    public function findAll() {
        return $this->users;
    }
}

class UserService extends BaseService {
    private $repository;
    
    public function __construct($repository) {
        parent::__construct('UserService');
        $this->repository = $repository;
    }
    
    public function getUser($id) {
        if ($this->validate($id)) {
            return $this->repository->find($id);
        }
        return null;
    }
    
    public function createUser($data) {
        if ($this->validate($data)) {
            $user = (object)$data;
            return $this->repository->save($user);
        }
        return null;
    }
}

interface IUserService {
    public function getUser($id);
    public function createUser($data);
}

abstract class AbstractService {
    abstract public function process($data);
    
    public function preProcess($data) {
        return $data;
    }
}
