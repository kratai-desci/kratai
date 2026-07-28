/**
 * Factory Pattern Test Fixture
 * Tests factory functions that create instances (new Constructor())
 */

class User {
    constructor(name, email) {
        this.name = name;
        this.email = email;
        this.createdAt = new Date();
    }
    
    isValid() {
        return this.name && this.email;
    }
}

class Product {
    constructor(title, price) {
        this.title = title;
        this.price = price;
    }
}

class Order {
    constructor(userId, items) {
        this.userId = userId;
        this.items = items;
        this.total = 0;
    }
}

// Factory function that creates User instances
function createUser(name, email) {
    // MUST detect: createUser creates User (new User())
    return new User(name, email);
}

// Factory function that creates Product instances
function createProduct(title, price) {
    // MUST detect: createProduct creates Product (new Product())
    return new Product(title, price);
}

// Factory with validation
function createValidatedUser(data) {
    if (!data.name || !data.email) {
        throw new Error('Invalid user data');
    }
    // MUST detect: factory creates User
    return new User(data.name, data.email);
}

// Factory that creates multiple instances
function createOrder(userId, productData) {
    const items = productData.map(data => new Product(data.title, data.price));
    // MUST detect: createOrder creates Order and Product
    return new Order(userId, items);
}

// Builder pattern (factory-like)
class UserBuilder {
    constructor() {
        this.userData = {};
    }
    
    withName(name) {
        this.userData.name = name;
        return this;
    }
    
    withEmail(email) {
        this.userData.email = email;
        return this;
    }
    
    build() {
        // MUST detect: build creates User
        return new User(this.userData.name, this.userData.email);
    }
}

module.exports = { User, Product, Order, createUser, createProduct, createValidatedUser, createOrder, UserBuilder };
