"""The LLM extraction contract — defined once and shared between the
extraction prompt (as JSON-schema instructions) and the response parser,
per docs/CONTRACT_CLM_BUILD_PLAN.md §7. The LLM never free-writes; its raw
response is validated against ContractExtractionResult on receipt.
"""

from datetime import date

from pydantic import BaseModel, Field

from app.db.enums import ContractType, ObligationCategory, RecurrenceType


class ExtractedObligation(BaseModel):
    category: ObligationCategory
    description: str = Field(min_length=1, max_length=2000)
    responsible_party: str = Field(min_length=1, max_length=500)
    trigger_date: date | None = None
    notice_period_days: int | None = Field(default=None, ge=0)
    monetary_amount: float | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    recurrence: RecurrenceType = RecurrenceType.NONE
    source_paragraph_id: str
    confidence: float = Field(ge=0.0, le=1.0)


class ContractExtractionResult(BaseModel):
    contract_type_guess: ContractType = ContractType.OTHER
    counterparty_name_guess: str | None = None
    effective_date_guess: date | None = None
    expiration_date_guess: date | None = None
    obligations: list[ExtractedObligation] = Field(default_factory=list)
