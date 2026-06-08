from abc import ABC, abstractmethod
from typing import Protocol


class IAnimal(Protocol):
    """Protocol (interface) for animals"""
    name: str
    age: int
    
    def make_sound(self) -> None: ...
    def eat(self, food: str) -> None: ...


class Animal(ABC):
    """Abstract base class for animals"""
    
    def __init__(self, name: str, age: int, species: str):
        self.name = name
        self.age = age
        self._species = species
    
    @abstractmethod
    def make_sound(self) -> None:
        pass
    
    def eat(self, food: str) -> None:
        print(f"{self.name} is eating {food}")
    
    def get_info(self) -> str:
        return f"{self.name} ({self._species}), age {self.age}"
