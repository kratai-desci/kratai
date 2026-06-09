from typing import List, Optional
from ..models.Product import Product


class ProductService:
    """Business logic for product operations"""
    
    def __init__(self):
        self.products = {}
        self.next_id = 1
    
    def get_all_products(self) -> List[Product]:
        """Get all products"""
        return list(self.products.values())
    
    def get_product_by_id(self, product_id: int) -> Optional[Product]:
        """Get product by ID"""
        return self.products.get(product_id)
    
    def create_product(self, name: str, price: float, stock: int = 0) -> Product:
        """Create new product"""
        product = Product(self.next_id, name, price, stock)
        self.next_id += 1
        self.products[product.id] = product
        return product
    
    def delete_product(self, product_id: int) -> bool:
        """Delete product"""
        if product_id in self.products:
            del self.products[product_id]
            return True
        return False
