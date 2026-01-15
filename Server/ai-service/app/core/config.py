"""
Configuration management for FastAPI AI Service
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # Gemini AI
    GEMINI_API_KEY: str
    
    # Database
    MONGODB_URI: str
    
    # Redis
    REDIS_URL: str
    
    # YouTube API
    YOUTUBE_API_KEY: str = ""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    
    # Environment
    ENVIRONMENT: str = "development"
    
    @property
    def origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
