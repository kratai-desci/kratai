from typing import Any, Dict


class ConfigManager:
    """Singleton configuration manager"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._config: Dict[str, Any] = {}
        self._load_defaults()
        self._initialized = True
    
    def _load_defaults(self):
        self._config['api_url'] = 'https://api.example.com'
        self._config['timeout'] = 5000
    
    def get(self, key: str) -> Any:
        return self._config.get(key)
    
    def set(self, key: str, value: Any) -> None:
        self._config[key] = value
