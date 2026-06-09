export interface IProduct {
    id: number;
    name: string;
    price: number;
}

export class Product implements IProduct {
    id: number;
    name: string;
    price: number;
    stock: number;

    constructor(id: number, name: string, price: number, stock: number = 0) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
    }

    isAvailable(): boolean {
        return this.stock > 0;
    }

    updateStock(quantity: number): void {
        this.stock += quantity;
    }
}
