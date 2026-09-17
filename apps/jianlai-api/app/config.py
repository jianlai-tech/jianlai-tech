from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql://jianlai:jianlai_dev@127.0.0.1:5434/jianlai"
    cors_origins: str = "http://localhost:5190"
    leads_admin_token: str = ""


settings = Settings()
