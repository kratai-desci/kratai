import { Product } from '../models/Product';

export class ProductService {
    private products: Map<number, Product> = new Map();
    private nextId: number = 1;

    constructor() {}

    getAllProducts(): Product[] {
        return Array.from(this.products.values());
    }

    getProductById(id: number): Product | undefined {
        return this.products.get(id);
    }

    createProduct(name: string, price: number, stock: number = 0): Product {
        const product = new Product(this.nextId++, name, price, stock);
        this.products.set(product.id, product);
        return product;
    }

    deleteProduct(id: number): boolean {
        return this.products.delete(id);
    }
}
