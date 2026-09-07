"""Phase 5 orchestration tests. These never call a real LLM API — every
provider call goes through `_StubProvider`, monkeypatched in for
`orchestration.build_provider`, per docs/CONTRACT_CLM_BUILD_PLAN.md's rule
that CI must never touch a real provider. See app/services/llm/extraction.py.
"""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.enums import (
    ContractStatus,
    ExtractionJobStatus,
    LLMProviderName,
    ObligationCategory,
    UserRole,
)
from app.db.models import (
    ClausePrecedentCache,
    Contract,
    ContractChunk,
    ExtractionJob,
    Obligation,
    Organization,
    User,
)
from app.services.llm import extraction as extraction_module
from app.services.llm import orchestration as orchestration_module
from app.services.llm.base import LLMCompletionResult, LLMProvider, LLMProviderError

EMBEDDING_DIM = 768
_UNIT_X = [1.0] + [0.0] * (EMBEDDING_DIM - 1)
_NEAR_X = [0.9995] + [0.002] * (EMBEDDING_DIM - 1)

_VALID_RESPONSE = """
{
  "contract_type_guess": "NDA",
  "counterparty_name_guess": "Acme Corp",
  "effective_date_guess": "2026-01-01",
  "expiration_date_guess": "2027-01-01",
  "obligations": [
    {
      "category": "RENEWAL",
      "description": "Contract auto-renews annually unless cancelled.",
      "responsible_party": "Either party",
      "trigger_date": "2027-01-01",
      "notice_period_days": 30,
      "monetary_amount": null,
      "currency": null,
      "recurrence": "annually",
      "source_paragraph_id": "P0",
      "confidence": 0.92
    }
  ]
}
"""

_MALFORMED_RESPONSE = "{not valid json"

_EMPTY_RESPONSE = '{"obligations": []}'


class _StubProvider(LLMProvider):
    """Returns queued canned responses/exceptions in order, one per call."""

    def __init__(self, name: LLMProviderName, responses: list[object]) -> None:
        self.name = name
        self._responses = list(responses)
        self.calls = 0

    async def complete_json(self, *, system_prompt: str, user_prompt: str) -> LLMCompletionResult:
        self.calls += 1
        outcome = self._responses.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return LLMCompletionResult(text=str(outcome), tokens_used=100)


async def _make_org(db_session: AsyncSession) -> Organization:
    org = Organization(name="Extraction Test Org")
    db_session.add(org)
    await db_session.flush()
    return org


async def _make_user(db_session: AsyncSession, *, org_id: uuid.UUID) -> User:
    user = User(
        org_id=org_id,
        email=f"{uuid.uuid4()}@example.com",
        hashed_password="not-a-real-hash",
        role=UserRole.LEGAL_OPS,
        full_name="Test User",
    )
    db_session.add(user)
    await db_session.flush()
    return user


async def _make_contract(
    db_session: AsyncSession, *, org_id: uuid.UUID, uploaded_by: uuid.UUID
) -> Contract:
    contract = Contract(
        org_id=org_id,
        uploaded_by=uploaded_by,
        title="Test Contract",
        original_filename="test.pdf",
        storage_path="storage/test.pdf",
        file_hash="a" * 64,
        status=ContractStatus.PROCESSING,
    )
    db_session.add(contract)
    await db_session.flush()
    return contract


async def _make_chunk(
    db_session: AsyncSession,
    *,
    contract_id: uuid.UUID,
    paragraph_index: int = 0,
    embedding: list[float] | None = _UNIT_X,
    passed_prefilter: bool = True,
) -> ContractChunk:
    chunk = ContractChunk(
        contract_id=contract_id,
        paragraph_index=paragraph_index,
        raw_text="This Agreement renews automatically for successive one-year terms.",
        embedding=embedding,
        passed_prefilter=passed_prefilter,
    )
    db_session.add(chunk)
    await db_session.flush()
    return chunk


async def _make_extraction_job(
    db_session: AsyncSession, *, contract_id: uuid.UUID
) -> ExtractionJob:
    job = ExtractionJob(contract_id=contract_id)
    db_session.add(job)
    await db_session.flush()
    return job


async def _setup(db_session: AsyncSession) -> tuple[Contract, ExtractionJob, ContractChunk]:
    org = await _make_org(db_session)
    user = await _make_user(db_session, org_id=org.id)
    contract = await _make_contract(db_session, org_id=org.id, uploaded_by=user.id)
    job = await _make_extraction_job(db_session, contract_id=contract.id)
    chunk = await _make_chunk(db_session, contract_id=contract.id)
    return contract, job, chunk


@pytest.mark.asyncio
async def test_valid_response_persists_obligations(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    contract, job, _chunk = await _setup(db_session)
    monkeypatch.setattr(get_settings(), "groq_api_key", "test-key")
    monkeypatch.setattr(
        orchestration_module,
        "build_provider",
        lambda name: _StubProvider(name, [_VALID_RESPONSE]),
    )

    await extraction_module.extract_contract_obligations(
        db_session, contract=contract, extraction_job=job
    )

    result = await db_session.execute(
        Obligation.__table__.select().where(Obligation.contract_id == contract.id)
    )
    obligations = result.fetchall()
    assert len(obligations) == 1
    assert obligations[0].category == ObligationCategory.RENEWAL

    assert job.status == ExtractionJobStatus.SUCCEEDED
    assert job.llm_provider_used == LLMProviderName.GROQ
    assert job.tokens_used_estimate == 100
    # High-stakes category (RENEWAL) is always routed to human review,
    # regardless of the LLM's own confidence score — see extraction.py.
    assert contract.status == ContractStatus.NEEDS_REVIEW


@pytest.mark.asyncio
async def test_malformed_json_triggers_one_corrective_retry(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    contract, job, _chunk = await _setup(db_session)
    monkeypatch.setattr(get_settings(), "groq_api_key", "test-key")
    stub = _StubProvider(LLMProviderName.GROQ, [_MALFORMED_RESPONSE, _VALID_RESPONSE])
    monkeypatch.setattr(orchestration_module, "build_provider", lambda name: stub)

    await extraction_module.extract_contract_obligations(
        db_session, contract=contract, extraction_job=job
    )

    assert stub.calls == 2
    assert job.status == ExtractionJobStatus.SUCCEEDED
    assert job.tokens_used_estimate == 200


@pytest.mark.asyncio
async def test_falls_back_to_second_provider_on_failure(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    contract, job, _chunk = await _setup(db_session)
    monkeypatch.setattr(get_settings(), "groq_api_key", "test-key")
    monkeypatch.setattr(get_settings(), "gemini_api_key", "test-key")

    def build(name: LLMProviderName) -> LLMProvider:
        if name == LLMProviderName.GROQ:
            return _StubProvider(name, [LLMProviderError("Groq is down")])
        return _StubProvider(name, [_VALID_RESPONSE])

    monkeypatch.setattr(orchestration_module, "build_provider", build)

    await extraction_module.extract_contract_obligations(
        db_session, contract=contract, extraction_job=job
    )

    assert job.status == ExtractionJobStatus.SUCCEEDED
    assert job.llm_provider_used == LLMProviderName.GEMINI


@pytest.mark.asyncio
async def test_no_provider_available_leaves_job_queued(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    contract, job, _chunk = await _setup(db_session)
    monkeypatch.setattr(get_settings(), "groq_api_key", None)
    monkeypatch.setattr(get_settings(), "gemini_api_key", None)

    await extraction_module.extract_contract_obligations(
        db_session, contract=contract, extraction_job=job
    )

    result = await db_session.execute(
        Obligation.__table__.select().where(Obligation.contract_id == contract.id)
    )
    assert result.fetchall() == []
    # Still queued, not failed — a future retry (Phase 7's worker) picks
    # this contract back up once a provider has headroom again.
    assert job.status == ExtractionJobStatus.QUEUED
    assert contract.status == ContractStatus.PROCESSING


@pytest.mark.asyncio
async def test_cache_hit_persists_without_calling_llm(
    db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    contract, job, chunk = await _setup(db_session)
    # No API keys configured at all — if the code path under test called
    # the LLM instead of using the cache, it would have no provider to
    # call and the obligation below would never be persisted.
    monkeypatch.setattr(get_settings(), "groq_api_key", None)
    monkeypatch.setattr(get_settings(), "gemini_api_key", None)

    db_session.add(
        ClausePrecedentCache(
            org_id=contract.org_id,
            text_hash="b" * 64,
            embedding=_NEAR_X,
            category=ObligationCategory.CONFIDENTIALITY,
            cached_extraction=[
                {
                    "category": "CONFIDENTIALITY",
                    "description": "Cached obligation from a prior identical clause.",
                    "responsible_party": "Both parties",
                    "trigger_date": None,
                    "notice_period_days": None,
                    "monetary_amount": None,
                    "currency": None,
                    "recurrence": "none",
                    "source_paragraph_id": "P0",
                    "confidence": 0.88,
                }
            ],
        )
    )
    await db_session.flush()

    await extraction_module.extract_contract_obligations(
        db_session, contract=contract, extraction_job=job
    )

    result = await db_session.execute(
        Obligation.__table__.select().where(Obligation.contract_id == contract.id)
    )
    obligations = result.fetchall()
    assert len(obligations) == 1
    assert obligations[0].category == ObligationCategory.CONFIDENTIALITY
    assert obligations[0].source_chunk_id == chunk.id
    assert job.status == ExtractionJobStatus.SUCCEEDED
    assert job.llm_provider_used is None
