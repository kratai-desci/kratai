import { ProductService } from '../services/ProductService';
import { Product } from '../models/Product';

export class ProductController {
    private productService: ProductService;

    constructor(productService: ProductService) {
        this.productService = productService;
    }

    getAll(): { products: Product[]; count: number } {
        const products = this.productService.getAllProducts();
        return { products, count: products.length };
    }

    getById(id: number): { product?: Product; error?: string } {
        const product = this.productService.getProductById(id);
        if (product) {
            return { product };
        }
        return { error: 'Product not found' };
    }

    create(name: string, price: number, stock: number = 0): { product: Product } {
        const product = this.productService.createProduct(name, price, stock);
        return { product };
    }

    delete(id: number): { success: boolean; message: string } {
        const success = this.productService.deleteProduct(id);
        return {
            success,
            message: success ? 'Product deleted' : 'Product not found'
        };
    }
}
