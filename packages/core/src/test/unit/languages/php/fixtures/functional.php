<?php
/**
 * Functional Programming Patterns Test Fixture
 * Tests functions, function calls, composition
 */

namespace App\Utils;

function validateUser($data) {
    return isset($data['name']) && isset($data['email']);
}

function saveUser($data) {
    // Simulate database save
    $data['id'] = uniqid();
    return $data;
}

function createUser($data) {
    if (validateUser($data)) {
        return saveUser($data);
    }
    return null;
}

function updateUser($id, $data) {
    if (validateUser($data)) {
        $existing = getUser($id);
        if ($existing) {
            $updated = array_merge($existing, $data);
            return saveUser($updated);
        }
    }
    return null;
}

function getUser($id) {
    return ['id' => $id, 'name' => 'Test User'];
}

function deleteUser($id) {
    $user = getUser($id);
    if ($user) {
        // Delete logic
        return true;
    }
    return false;
}

function processUsers($users) {
    return array_filter($users, 'App\Utils\validateUser');
}

// Higher-order function example
function transform($data, $callback) {
    return $callback($data);
}

// Anonymous function (closure)
$formatter = function($user) {
    return strtoupper($user['name']);
};
