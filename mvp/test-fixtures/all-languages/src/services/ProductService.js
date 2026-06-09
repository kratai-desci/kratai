const Product = require('../models/Product');

class ProductService {
    constructor() {
        this.products = new Map();
        this.nextId = 1;
    }

    getAllProducts() {
        return Array.from(this.products.values());
    }

    getProductById(id) {
        return this.products.get(id);
    }

    createProduct(name, price, stock = 0) {
        const product = new Product(this.nextId++, name, price, stock);
        this.products.set(product.id, product);
        return product;
    }

    deleteProduct(id) {
        return this.products.delete(id);
    }
}

module.exports = ProductService;
