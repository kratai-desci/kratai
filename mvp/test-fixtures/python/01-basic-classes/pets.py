from animal import Animal


class Dog(Animal):
    """Dog class extending Animal"""
    
    def __init__(self, name: str, age: int, breed: str):
        super().__init__(name, age, "Canine")
        self._breed = breed
    
    def make_sound(self) -> None:
        print(f"{self.name} barks: Woof!")
    
    def fetch(self, item: str) -> None:
        print(f"{self.name} fetches the {item}")
    
    @property
    def breed(self) -> str:
        return self._breed


class Cat(Animal):
    """Cat class extending Animal"""
    
    def __init__(self, name: str, age: int, indoor: bool = True):
        super().__init__(name, age, "Feline")
        self._indoor = indoor
    
    def make_sound(self) -> None:
        print(f"{self.name} meows: Meow!")
    
    def climb(self) -> None:
        print(f"{self.name} climbs a tree")
    
    @property
    def is_indoor(self) -> bool:
        return self._indoor
