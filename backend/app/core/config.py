from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API
    CORS_ORIGINS: str
    APP_ENV: str
    APP_DEBUG: bool
    SECRET_KEY: str 
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    # DB
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int
    DATABASE_MAX_OVERFLOW: int

    class Config:
        env_file = ".env"

settings = Settings()