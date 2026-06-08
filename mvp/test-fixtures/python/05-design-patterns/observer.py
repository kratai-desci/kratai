from abc import ABC, abstractmethod
from typing import List, Any


class Observer(ABC):
    """Observer interface"""
    
    @abstractmethod
    def update(self, data: Any) -> None:
        pass


class Subject(ABC):
    """Subject interface"""
    
    @abstractmethod
    def attach(self, observer: Observer) -> None:
        pass
    
    @abstractmethod
    def detach(self, observer: Observer) -> None:
        pass
    
    @abstractmethod
    def notify(self, data: Any) -> None:
        pass


class EventEmitter(Subject):
    """Concrete subject implementation"""
    
    def __init__(self):
        self._observers: List[Observer] = []
    
    def attach(self, observer: Observer) -> None:
        self._observers.append(observer)
    
    def detach(self, observer: Observer) -> None:
        self._observers.remove(observer)
    
    def notify(self, data: Any) -> None:
        for observer in self._observers:
            observer.update(data)


class Logger(Observer):
    """Logger observer"""
    
    def update(self, data: Any) -> None:
        print(f"[Logger] Event received: {data}")


class EmailNotifier(Observer):
    """Email notifier observer"""
    
    def update(self, data: Any) -> None:
        print(f"[EmailNotifier] Sending email for: {data}")
