import pytest
from pydantic import ValidationError

from app.core.config import Settings

# _env_file=None on every Settings(...) below: these tests assert on the
# class's hardcoded defaults, which must hold regardless of whatever a
# developer's own local .env happens to contain.


def test_production_rejects_default_jwt_secret() -> None:
    with pytest.raises(ValidationError, match="JWT_SECRET_KEY"):
        Settings(  # type: ignore[call-arg]
            _env_file=None,
            environment="production",
            database_url="postgresql+asyncpg://real_user:real_pass@prod-host:5432/oblitrack",
        )


def test_production_rejects_default_db_credentials() -> None:
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(  # type: ignore[call-arg]
            _env_file=None,
            environment="production",
            jwt_secret_key="a" * 32,
        )


def test_production_accepts_properly_configured_secrets() -> None:
    settings = Settings(  # type: ignore[call-arg]
        _env_file=None,
        environment="production",
        jwt_secret_key="a" * 32,
        database_url="postgresql+asyncpg://real_user:real_pass@prod-host:5432/oblitrack",
    )
    assert settings.environment == "production"


def test_development_allows_insecure_defaults() -> None:
    settings = Settings(_env_file=None, environment="development")  # type: ignore[call-arg]
    assert settings.jwt_secret_key == "dev-only-insecure-secret-change-me"
