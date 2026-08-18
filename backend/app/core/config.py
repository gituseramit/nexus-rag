from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://nexus:nexus@localhost:5432/nexus_rag"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = "changeme-in-production-please"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    OPENAI_API_KEY: str = ""
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    LLM_MODEL: str = "gpt-4o"
    COHERE_API_KEY: str = ""
    STORAGE_BACKEND: str = "local"
    STORAGE_LOCAL_PATH: str = "./uploads"
    AWS_BUCKET: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_FILE_EXTENSIONS: list[str] = ["pdf", "docx", "txt", "md", "csv"]
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    TOP_K_RETRIEVAL: int = 5
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
