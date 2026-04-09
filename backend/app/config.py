from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    openai_api_key: str = ""
    gemini_api_key: str = ""
    default_llm_provider: str = "openai"
    embedding_provider: str = "openai"

    chroma_persist_dir: str = "./data/chroma"
    sqlite_db_path: str = "./data/aitutor.db"
    upload_dir: str = "./uploads"
    cors_origins: str = "http://localhost:3000"

    chunk_size: int = 1000
    chunk_overlap: int = 200
    retrieval_top_k: int = 5

    summary_batch_size: int = 10
    summary_max_content_per_batch: int = 8000

    model_config = {"env_file": ".env", "extra": "ignore"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    def ensure_dirs(self):
        Path(self.chroma_persist_dir).mkdir(parents=True, exist_ok=True)
        Path(self.upload_dir).mkdir(parents=True, exist_ok=True)
        Path(self.sqlite_db_path).parent.mkdir(parents=True, exist_ok=True)


settings = Settings()
