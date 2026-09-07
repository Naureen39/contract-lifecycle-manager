"""Application configuration.

All configuration is loaded from environment variables (optionally via a
local `.env` file, never committed) using pydantic-settings. See
`.env.example` at the repo root for the full list of variables a deployment
must provide.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Placeholder-only values: fine for local dev, never acceptable once
# ENVIRONMENT=production — see Settings._forbid_insecure_defaults_in_production.
_INSECURE_DEV_JWT_SECRET = "dev-only-insecure-secret-change-me"
_INSECURE_DEV_DB_CREDENTIALS = "oblitrack:oblitrack@"

# Resolved from this file's own location rather than left as the relative
# ".env" pydantic-settings default: the README's native dev workflow runs
# uvicorn from inside backend/, while .env/.env.example live at the repo
# root (required there so Docker Compose's `cp .env.example .env` step
# works). A cwd-relative path silently found nothing in that case — every
# optional setting (LLM provider keys included) fell back to its default
# with no error, which is exactly what let a real deployed .env go unread.
_REPO_ROOT_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_REPO_ROOT_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- App ---
    app_name: str = "ObliTrack API"
    environment: Literal["development", "test", "staging", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    cors_allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    # --- Database (wired up in Phase 1) ---
    database_url: str = "postgresql+asyncpg://oblitrack:oblitrack@localhost:5432/oblitrack"

    # --- Auth (wired up in Phase 2) ---
    jwt_secret_key: str = _INSECURE_DEV_JWT_SECRET
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # --- Document storage (wired up in Phase 3) ---
    storage_root: str = "storage"

    # --- Local embeddings (wired up in Phase 4) ---
    # bge-base-en-v1.5 produces 768-dim vectors, matching the
    # contract_chunks.embedding / clause_precedent_cache.embedding column
    # width fixed in the Phase 1 migration — changing this requires a new
    # migration to match.
    embedding_model_name: str = "BAAI/bge-base-en-v1.5"

    # --- LLM providers (wired up in Phase 5) ---
    groq_api_key: str | None = None
    gemini_api_key: str | None = None
    # Conservative free-tier defaults per docs/CONTRACT_CLM_BUILD_PLAN.md
    # §3 ("Groq: ~1,000 requests/day, ~200K tokens/day"; Gemini's free
    # tier is vaguer — "a few hundred to ~1,500 RPD depending on model" —
    # so this defaults to the low end). Override via env once you know
    # your account's actual observed limits.
    groq_daily_request_limit: int = 1000
    groq_daily_token_limit: int = 200_000
    gemini_daily_request_limit: int = 250
    gemini_daily_token_limit: int = 1_000_000

    # --- SMTP / scheduler (wired up in Phase 7) ---
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_address: str | None = None
    # UTC time the daily obligation-status-recompute + alert-scan job runs
    # in the `worker` process — see app/worker.py and services/alerts.py.
    alert_scan_hour_utc: int = 7
    alert_scan_minute_utc: int = 0
    # How often the `worker` process retries extraction_jobs left QUEUED
    # because no LLM provider had quota headroom at upload time — see
    # app/worker.py and services/ingestion.py's retry_queued_extractions.
    extraction_retry_interval_minutes: int = 30

    # --- Chatbot (docs/CHATBOT_INTEGRATION_PLAN.md, Phase 12) ---
    # Local cross-encoder for reranking the RRF-fused retrieval candidates
    # (plan §3.5) — CPU-only, no API cost, same "loaded once" pattern as
    # embedding_model_name. See services/reranker.py.
    reranker_model_name: str = "BAAI/bge-reranker-base"
    # Minimum embedding-similarity for the input scope classifier (plan
    # §6.1) to accept a query as in-scope, and minimum reranker relevance
    # (post-sigmoid, [0,1]) for a retrieved chunk to be usable as grounding
    # evidence at all — below either, the pipeline answers
    # insufficient_information rather than guess. See services/chat/.
    chat_scope_classifier_threshold: float = 0.5
    chat_min_relevance_threshold: float = 0.3
    # Minimum lexical/embedding overlap between a cited sentence and its
    # referenced chunk for the cheap local faithfulness check (plan §6.2)
    # to accept it without escalating to an LLM-judge call.
    chat_faithfulness_overlap_threshold: float = 0.6
    # Cost/latency guardrails (plan §6.3): how much prior conversation is
    # carried into each generation prompt, and how many reranked chunks
    # are ever included as context.
    chat_max_history_messages: int = 10
    chat_max_context_chunks: int = 8
    # Per-user chat message rate limit, in slowapi's own "N/period" syntax
    # — same rate-limiting middleware as the auth endpoints (plan §6.3).
    chat_rate_limit: str = "20/minute"

    # --- Observability: self-hosted Langfuse (plan §8) ---
    # All three unset (the default) means tracing is a no-op — the chat
    # pipeline must work identically with or without Langfuse running; see
    # services/observability.py. Never a SaaS/cloud host by design — this
    # points at the self-hosted instance started via
    # infra/docker-compose.langfuse.yml.
    langfuse_host: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None

    @model_validator(mode="after")
    def _forbid_insecure_defaults_in_production(self) -> "Settings":
        """Fail fast at startup rather than silently running production
        traffic on a guessable JWT signing secret or default DB
        credentials — see docs/CONTRACT_CLM_BUILD_PLAN.md §6.7."""
        if self.environment != "production":
            return self

        problems: list[str] = []
        if self.jwt_secret_key == _INSECURE_DEV_JWT_SECRET or len(self.jwt_secret_key) < 32:
            problems.append(
                "JWT_SECRET_KEY must be set to a unique, random value of at least 32 "
                "characters when ENVIRONMENT=production."
            )
        if _INSECURE_DEV_DB_CREDENTIALS in self.database_url:
            problems.append(
                "DATABASE_URL is still using the default dev credentials "
                "(oblitrack:oblitrack) — set real production credentials."
            )
        if problems:
            raise ValueError(" ".join(problems))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
