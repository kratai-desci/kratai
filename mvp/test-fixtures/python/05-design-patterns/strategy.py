from abc import ABC, abstractmethod


class PaymentStrategy(ABC):
    """Payment strategy interface"""
    
    @abstractmethod
    def pay(self, amount: float) -> None:
        pass


class CreditCardPayment(PaymentStrategy):
    """Credit card payment strategy"""
    
    def __init__(self, card_number: str):
        self._card_number = card_number
    
    def pay(self, amount: float) -> None:
        print(f"Paid ${amount} with credit card ending in {self._card_number[-4:]}")


class PayPalPayment(PaymentStrategy):
    """PayPal payment strategy"""
    
    def __init__(self, email: str):
        self._email = email
    
    def pay(self, amount: float) -> None:
        print(f"Paid ${amount} via PayPal to {self._email}")


class CryptoPayment(PaymentStrategy):
    """Cryptocurrency payment strategy"""
    
    def __init__(self, wallet_address: str):
        self._wallet_address = wallet_address
    
    def pay(self, amount: float) -> None:
        print(f"Paid ${amount} in crypto to {self._wallet_address}")


class PaymentProcessor:
    """Payment processor using strategy pattern"""
    
    def __init__(self, strategy: PaymentStrategy):
        self._strategy = strategy
    
    def set_strategy(self, strategy: PaymentStrategy) -> None:
        self._strategy = strategy
    
    def process_payment(self, amount: float) -> None:
        self._strategy.pay(amount)
