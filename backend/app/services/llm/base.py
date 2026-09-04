"""The LLMProvider strategy interface — both Groq and Gemini are called
through this single abstraction (docs/CONTRACT_CLM_BUILD_PLAN.md §3), so
adding a third provider later is a one-file change, and the orchestration
logic in extraction.py never needs to know which provider it's talking to.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.db.enums import LLMProviderName


class LLMProviderError(Exception):
    """A provider call failed for a reason that isn't quota exhaustion —
    auth, network, malformed request, provider-side outage."""


class LLMRateLimitError(LLMProviderError):
    """The provider reported 429 / quota exhausted for this key right
    now. Distinct from LLMProviderError so callers can react differently
    (try the next provider) rather than treating it as a hard failure."""


@dataclass(frozen=True)
class LLMCompletionResult:
    text: str
    tokens_used: int


class LLMProvider(ABC):
    name: LLMProviderName

    @abstractmethod
    async def complete_json(self, *, system_prompt: str, user_prompt: str) -> LLMCompletionResult:
        """Sends one prompt, returns the raw response text (expected to
        be a single JSON object matching ContractExtractionResult) plus
        an accurate token-usage count from the provider's own response
        metadata. Raises LLMRateLimitError on 429/quota errors, or
        LLMProviderError for anything else that goes wrong."""
