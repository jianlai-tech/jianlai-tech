from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql://jianlai:jianlai_dev@127.0.0.1:5434/jianlai"
    cors_origins: str = (
        "http://localhost:5190,http://localhost:5191,https://jianlai.brewshujian.cafe"
    )
    leads_admin_token: str = ""
    wecom_group_webhook: str = ""
    wecom_bot_id: str = ""
    wecom_bot_secret: str = ""
    wecom_group_chat_id: str = ""
    sophnet_api_key: str = ""
    sophnet_base_url: str = "https://www.sophnet.com/api/open-apis/v1"
    sophnet_model: str = "DeepSeek-Flash"


settings = Settings()
