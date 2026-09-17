import os
from pathlib import Path
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    # Backend-only Firebase Admin configuration.
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    FIREBASE_SERVICE_ACCOUNT_JSON: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    ALLOW_DEMO_AUTH: bool = os.getenv("ALLOW_DEMO_AUTH", "false").lower() == "true"
    MESSAGE_DAILY_LIMIT: int = int(os.getenv("MESSAGE_DAILY_LIMIT", "100"))
    MESSAGE_MAX_LENGTH: int = int(os.getenv("MESSAGE_MAX_LENGTH", "2000"))
    MESSAGE_HISTORY_LIMIT: int = int(os.getenv("MESSAGE_HISTORY_LIMIT", "100"))


    class Config:
        env_file = BACKEND_DIR / ".env"

settings = Settings()
