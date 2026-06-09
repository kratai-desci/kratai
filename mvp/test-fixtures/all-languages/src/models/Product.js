class Product {
    constructor(id, name, price, stock = 0) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
    }

    isAvailable() {
        return this.stock > 0;
    }

    updateStock(quantity) {
        this.stock += quantity;
    }
}

module.exports = Product;
