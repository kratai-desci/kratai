from typing import Dict
from ..services.ProductService import ProductService
from ..models.Product import Product


class ProductController:
    """Controller for product endpoints"""
    
    def __init__(self, product_service: ProductService):
        self.product_service = product_service
    
    def get_all(self) -> Dict:
        """GET /products - Get all products"""
        products = self.product_service.get_all_products()
        return {
            'products': products,
            'count': len(products)
        }
    
    def get_by_id(self, product_id: int) -> Dict:
        """GET /products/{id} - Get product by ID"""
        product = self.product_service.get_product_by_id(product_id)
        if product:
            return {'product': product}
        return {'error': 'Product not found'}
    
    def create(self, name: str, price: float, stock: int = 0) -> Dict:
        """POST /products - Create new product"""
        product = self.product_service.create_product(name, price, stock)
        return {'product': product}
    
    def delete(self, product_id: int) -> Dict:
        """DELETE /products/{id} - Delete product"""
        success = self.product_service.delete_product(product_id)
        return {
            'success': success,
            'message': 'Product deleted' if success else 'Product not found'
        }
