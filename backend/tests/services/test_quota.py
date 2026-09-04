import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.enums import LLMProviderName
from app.services.llm import quota


@pytest.mark.asyncio
async def test_provider_without_api_key_has_no_headroom(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "groq_api_key", None)

    assert await quota.has_headroom(db_session, LLMProviderName.GROQ) is False


@pytest.mark.asyncio
async def test_configured_provider_with_no_usage_yet_has_headroom(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "groq_api_key", "test-key")

    assert await quota.has_headroom(db_session, LLMProviderName.GROQ) is True


@pytest.mark.asyncio
async def test_provider_at_request_limit_has_no_headroom(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "groq_api_key", "test-key")
    monkeypatch.setattr(get_settings(), "groq_daily_request_limit", 1)

    await quota.record_usage(db_session, LLMProviderName.GROQ, tokens=10)

    assert await quota.has_headroom(db_session, LLMProviderName.GROQ) is False


@pytest.mark.asyncio
async def test_provider_at_token_limit_has_no_headroom(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "groq_api_key", "test-key")
    monkeypatch.setattr(get_settings(), "groq_daily_token_limit", 100)

    await quota.record_usage(db_session, LLMProviderName.GROQ, tokens=100)

    assert await quota.has_headroom(db_session, LLMProviderName.GROQ) is False


@pytest.mark.asyncio
async def test_record_usage_accumulates_across_calls(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "groq_api_key", "test-key")

    await quota.record_usage(db_session, LLMProviderName.GROQ, tokens=100)
    await quota.record_usage(db_session, LLMProviderName.GROQ, tokens=50)

    usage = await quota._usage_today(db_session, LLMProviderName.GROQ)
    assert usage is not None
    assert usage.requests_used == 2
    assert usage.tokens_used == 150


@pytest.mark.asyncio
async def test_select_provider_skips_unconfigured_and_falls_back(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "groq_api_key", None)
    monkeypatch.setattr(get_settings(), "gemini_api_key", "test-key")

    assert await quota.select_provider(db_session) == LLMProviderName.GEMINI


@pytest.mark.asyncio
async def test_select_provider_returns_none_when_nothing_has_headroom(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(get_settings(), "groq_api_key", None)
    monkeypatch.setattr(get_settings(), "gemini_api_key", None)

    assert await quota.select_provider(db_session) is None
