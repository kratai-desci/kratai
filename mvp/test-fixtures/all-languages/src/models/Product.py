class Product:
    """Product model"""
    
    id: int
    name: str
    price: float
    stock: int
    
    def __init__(self, id: int, name: str, price: float, stock: int = 0):
        self.id = id
        self.name = name
        self.price = price
        self.stock = stock
    
    def is_available(self) -> bool:
        """Check if product is in stock"""
        return self.stock > 0
    
    def update_stock(self, quantity: int) -> None:
        """Update product stock"""
        self.stock += quantity
