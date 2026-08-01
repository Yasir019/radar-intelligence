from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    demo_mode: bool = True
    jwt_secret: str = "dev-secret-change-me"
    service_api_key: str = "change-me-n8n-key"
    n8n_webhook_url: str = ""
    # Production storage is Supabase PostgreSQL. Keep this unset by default so
    # a deployment cannot silently fall back to ephemeral SQLite storage.
    database_url: str = ""
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_publishable_key: str = ""
    supabase_jwt_secret: str = ""
    # Server-only key used to validate Supabase sessions from the API.
    # Never expose this value to the frontend.
    supabase_service_role_key: str = ""

    @property
    def effective_demo_mode(self) -> bool:
        # Demo mode is on when explicitly enabled or when no Groq key exists.
        return self.demo_mode or not self.groq_api_key


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
