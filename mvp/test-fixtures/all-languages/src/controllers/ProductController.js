const ProductService = require('../services/ProductService');

class ProductController {
    constructor(productService) {
        this.productService = productService;
    }

    getAll() {
        const products = this.productService.getAllProducts();
        return { products, count: products.length };
    }

    getById(id) {
        const product = this.productService.getProductById(id);
        if (product) {
            return { product };
        }
        return { error: 'Product not found' };
    }

    create(name, price, stock = 0) {
        const product = this.productService.createProduct(name, price, stock);
        return { product };
    }

    delete(id) {
        const success = this.productService.deleteProduct(id);
        return {
            success,
            message: success ? 'Product deleted' : 'Product not found'
        };
    }
}

module.exports = ProductController;
