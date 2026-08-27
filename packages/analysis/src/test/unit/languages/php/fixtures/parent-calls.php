<?php
/**
 * Parent Calls Test Fixture
 * Tests parent::method() calls and super class interactions
 */

namespace App\Services;

class BaseService {
    protected string $name;
    
    public function __construct(string $name) {
        $this->name = $name;
    }
    
    public function validate($data): bool {
        return !empty($data);
    }
    
    public function process($data) {
        return $this->validate($data) ? $data : null;
    }
}

class UserService extends BaseService {
    public function __construct() {
        parent::__construct('UserService');
    }
    
    public function validate($data): bool {
        // Call parent validation first
        if (!parent::validate($data)) {
            return false;
        }
        // Additional validation
        return isset($data['email']);
    }
    
    public function process($data) {
        // Call parent process
        $result = parent::process($data);
        if ($result) {
            $result['processed_by'] = $this->name;
        }
        return $result;
    }
}

class AdminService extends UserService {
    public function __construct() {
        parent::__construct();
    }
    
    public function validate($data): bool {
        // 3-level inheritance: AdminService -> UserService -> BaseService
        return parent::validate($data) && isset($data['role']);
    }
    
    public function process($data) {
        $result = parent::process($data);
        if ($result) {
            $result['admin_processed'] = true;
        }
        return $result;
    }
}
