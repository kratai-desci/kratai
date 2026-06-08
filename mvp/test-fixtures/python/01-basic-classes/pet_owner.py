from typing import List
from animal import Animal


class PetOwner:
    """Pet owner managing multiple pets"""
    
    def __init__(self, name: str, address: str):
        self.name = name
        self._address = address
        self._pets: List[Animal] = []
    
    def add_pet(self, pet: Animal) -> None:
        self._pets.append(pet)
        print(f"{self.name} adopted {pet.name}")
    
    def list_pets(self) -> None:
        print(f"{self.name}'s pets:")
        for pet in self._pets:
            print(f"- {pet.get_info()}")
    
    def feed_all_pets(self, food: str) -> None:
        for pet in self._pets:
            pet.eat(food)
    
    @property
    def pet_count(self) -> int:
        return len(self._pets)
