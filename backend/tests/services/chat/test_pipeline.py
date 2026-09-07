"""Pipeline-level orchestration tests: does run_chat_turn route each
intent to the right path end to end. Generation/guardrail/retrieval
correctness is covered by their own dedicated test files — these tests
verify the wiring between them, using real (org-scoped, transaction-
isolated) DB fixtures for the calendar-query and domain-question paths.
"""

import uuid
from datetime import date, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.enums import (
    ChatIntent,
    ChatSessionScope,
    ContractStatus,
    ContractType,
    LLMProviderName,
    ObligationCategory,
    ObligationStatus,
    UserRole,
)
from app.db.models import Contract, ContractChunk, Obligation, Organization, User
from app.services.chat.pipeline import run_chat_turn
from app.services.embeddings import embed_text
from app.services.llm import orchestration as orchestration_module
from app.services.llm.base import LLMCompletionResult, LLMProvider


class _StubProvider(LLMProvider):
    def __init__(self, name: LLMProviderName, response_text: str) -> None:
        self.name = name
        self._response_text = response_text

    async def complete_json(self, *, system_prompt: str, user_prompt: str) -> LLMCompletionResult:
        return LLMCompletionResult(text=self._response_text, tokens_used=42)


async def _make_org_user(db_session: AsyncSession) -> tuple[Organization, User]:
    org = Organization(name="Pipeline Test Org")
    db_session.add(org)
    await db_session.flush()
    user = User(
        org_id=org.id,
        email=f"{uuid.uuid4()}@example.com",
        hashed_password="irrelevant",
        role=UserRole.ADMIN,
        full_name="Test User",
    )
    db_session.add(user)
    await db_session.flush()
    return org, user


@pytest.mark.asyncio
async def test_out_of_scope_question_declines_without_any_retrieval(
    db_session: AsyncSession,
) -> None:
    org, _user = await _make_org_user(db_session)

    result = await run_chat_turn(
        db_session,
        org_id=org.id,
        scope=ChatSessionScope.ORGANIZATION,
        scope_contract_id=None,
        question="Write me a poem about autumn.",
        history=[],
    )

    assert result.intent == ChatIntent.OUT_OF_SCOPE
    assert result.answer.confidence == "insufficient_information"
    assert result.tokens_used == 0


@pytest.mark.asyncio
async def test_calendar_query_routes_to_direct_sql_no_llm_call(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    org, user = await _make_org_user(db_session)
    contract = Contract(
        org_id=org.id,
        uploaded_by=user.id,
        title="Overdue Contract",
        contract_type=ContractType.NDA,
        original_filename="test.pdf",
        storage_path="storage/test.pdf",
        file_hash=uuid.uuid4().hex + uuid.uuid4().hex,
        status=ContractStatus.ACTIVE,
    )
    db_session.add(contract)
    await db_session.flush()
    db_session.add(
        Obligation(
            contract_id=contract.id,
            category=ObligationCategory.PAYMENT_MILESTONE,
            description="Quarterly invoice payment.",
            trigger_date=date.today() - timedelta(days=5),
            status=ObligationStatus.OVERDUE,
        )
    )
    await db_session.flush()

    def _fail_if_called(name: LLMProviderName) -> LLMProvider:
        raise AssertionError("calendar-query intent must never call the LLM")

    monkeypatch.setattr(orchestration_module, "build_provider", _fail_if_called)

    result = await run_chat_turn(
        db_session,
        org_id=org.id,
        scope=ChatSessionScope.ORGANIZATION,
        scope_contract_id=None,
        question="What obligations are overdue?",
        history=[],
    )

    assert result.intent == ChatIntent.CALENDAR_QUERY
    assert "Quarterly invoice payment" in result.answer.answer_text
    assert result.tokens_used == 0


@pytest.mark.asyncio
async def test_domain_question_retrieves_and_generates_grounded_answer(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    org, user = await _make_org_user(db_session)
    contract = Contract(
        org_id=org.id,
        uploaded_by=user.id,
        title="Acme NDA",
        contract_type=ContractType.NDA,
        original_filename="test.pdf",
        storage_path="storage/test.pdf",
        file_hash=uuid.uuid4().hex + uuid.uuid4().hex,
        status=ContractStatus.ACTIVE,
    )
    db_session.add(contract)
    await db_session.flush()
    chunk_text = "Either party may terminate this Agreement upon 60 days written notice."
    db_session.add(
        ContractChunk(
            contract_id=contract.id,
            paragraph_index=0,
            raw_text=chunk_text,
            embedding=embed_text(chunk_text),
            is_boilerplate=False,
            passed_prefilter=True,
        )
    )
    await db_session.flush()

    monkeypatch.setattr(get_settings(), "groq_api_key", "test-key")
    response = (
        '{"answer_text": "The termination notice period is 60 days [1].", "confidence": "high"}'
    )
    monkeypatch.setattr(
        orchestration_module,
        "build_provider",
        lambda name: _StubProvider(name, response),
    )

    result = await run_chat_turn(
        db_session,
        org_id=org.id,
        scope=ChatSessionScope.ORGANIZATION,
        scope_contract_id=None,
        question="What is the termination notice period?",
        history=[],
    )

    assert result.intent == ChatIntent.DOMAIN_QUESTION
    assert result.answer.confidence == "high"
    assert len(result.answer.citations) == 1
    assert result.answer.citations[0].contract_id == contract.id


@pytest.mark.asyncio
async def test_domain_question_with_no_matching_chunks_is_insufficient_information(
    db_session: AsyncSession,
) -> None:
    org, _user = await _make_org_user(db_session)

    result = await run_chat_turn(
        db_session,
        org_id=org.id,
        scope=ChatSessionScope.ORGANIZATION,
        scope_contract_id=None,
        question="What is the termination notice period in our vendor agreement?",
        history=[],
    )

    assert result.intent == ChatIntent.DOMAIN_QUESTION
    assert result.answer.confidence == "insufficient_information"


@pytest.mark.asyncio
async def test_contract_scoped_session_never_pulls_another_contracts_chunks(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    org, user = await _make_org_user(db_session)
    scoped_contract = Contract(
        org_id=org.id,
        uploaded_by=user.id,
        title="Scoped Contract",
        contract_type=ContractType.NDA,
        original_filename="a.pdf",
        storage_path="storage/a.pdf",
        file_hash=uuid.uuid4().hex + uuid.uuid4().hex,
        status=ContractStatus.ACTIVE,
    )
    other_contract = Contract(
        org_id=org.id,
        uploaded_by=user.id,
        title="Other Contract",
        contract_type=ContractType.NDA,
        original_filename="b.pdf",
        storage_path="storage/b.pdf",
        file_hash=uuid.uuid4().hex + uuid.uuid4().hex,
        status=ContractStatus.ACTIVE,
    )
    db_session.add_all([scoped_contract, other_contract])
    await db_session.flush()
    other_chunk_text = "Either party may terminate this Agreement upon 60 days written notice."
    db_session.add_all(
        [
            ContractChunk(
                contract_id=other_contract.id,
                paragraph_index=0,
                raw_text=other_chunk_text,
                embedding=embed_text(other_chunk_text),
                is_boilerplate=False,
                passed_prefilter=True,
            )
        ]
    )
    await db_session.flush()

    result = await run_chat_turn(
        db_session,
        org_id=org.id,
        scope=ChatSessionScope.CONTRACT,
        scope_contract_id=scoped_contract.id,
        question="What is the termination notice period?",
        history=[],
    )

    # The only matching chunk belongs to a *different* contract than the
    # one this session is scoped to — it must not be retrieved at all,
    # so there's nothing to ground an answer in.
    assert result.answer.confidence == "insufficient_information"
