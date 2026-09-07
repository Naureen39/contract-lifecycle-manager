import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.db.enums import ChatConfidence, ChatFeedback, ChatIntent, ChatRole, ChatSessionScope


class ChatCitation(BaseModel):
    """One numbered reference in an assistant answer, per plan §4 —
    `ref_number` matches an inline `[n]` marker in `answer_text`.

    `source_chunk_id`/`contract_id` are null for a clause-benchmark
    citation into the CUAD reference corpus (plan §3.2): that material
    isn't one of the requesting org's own contracts, so there's no
    document-viewer page for the frontend's "View in document" action to
    open — the citation is still real and shown, just not clickable.
    `is_reference_corpus` is what the frontend uses to tell the two apart
    without inferring it from a null check."""

    ref_number: int
    source_chunk_id: uuid.UUID | None
    contract_id: uuid.UUID | None
    contract_title: str
    snippet: str
    is_reference_corpus: bool = False


class ChatAnswer(BaseModel):
    """The LLM's raw structured output, parsed and validated before any of
    it reaches a user — never rendered as free-form text with inline
    citations the backend hasn't checked (plan §4)."""

    answer_text: str
    citations: list[ChatCitation] = Field(default_factory=list)
    confidence: Literal["high", "medium", "low", "insufficient_information"]


class ChatSessionCreate(BaseModel):
    scope: ChatSessionScope
    # Required when scope=contract, forbidden when scope=organization —
    # enforced in api/v1/chat.py (a cross-field Pydantic validator can't
    # see the requesting user's org to also confirm the contract belongs
    # to it, so that check has to happen against the DB anyway).
    contract_id: uuid.UUID | None = None
    title: str | None = Field(default=None, max_length=255)


class ChatSessionSummary(BaseModel):
    id: uuid.UUID
    scope: ChatSessionScope
    contract_id: uuid.UUID | None
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageSummary(BaseModel):
    id: uuid.UUID
    role: ChatRole
    content: str
    confidence: ChatConfidence | None
    intent: ChatIntent | None
    citations: list[ChatCitation] | None
    feedback: ChatFeedback
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionDetail(ChatSessionSummary):
    messages: list[ChatMessageSummary] = Field(default_factory=list)


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class ChatFeedbackUpdate(BaseModel):
    feedback: ChatFeedback


class EvaluationSummary(BaseModel):
    """Plan §7's admin quality view: online signal (real user feedback,
    always available) plus offline signal (the last CI-gated RAGAS-style
    run, when scripts/run_rag_evaluation.py has been run at least once —
    see docs/CHATBOT_EVALUATION.md). `offline_*` fields are null rather
    than fabricated when no evaluation run has ever been recorded."""

    total_assistant_messages: int
    feedback_up_count: int
    feedback_down_count: int
    insufficient_information_rate: float
    offline_eval_run_at: datetime | None
    offline_faithfulness: float | None
    offline_answer_relevancy: float | None
    offline_context_precision: float | None
    offline_context_recall: float | None
