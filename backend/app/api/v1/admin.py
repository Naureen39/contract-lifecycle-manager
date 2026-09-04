from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_role
from app.db.enums import UserRole
from app.db.models import User
from app.schemas.alert import AlertScanResponse
from app.schemas.llm_usage import LLMUsageSummary
from app.services.alerts import run_alert_scan
from app.services.llm import quota

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
async def ping(
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> dict[str, str]:
    return {"status": "ok", "org_id": str(current_user.org_id)}


@router.post("/alerts/scan", response_model=AlertScanResponse)
async def trigger_alert_scan(
    db: DbSession,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> AlertScanResponse:
    """Runs the same daily recompute-status + send-alerts job the `worker`
    process runs on its cron schedule, on demand — for testing/demoing
    without waiting a day (docs/CONTRACT_CLM_BUILD_PLAN.md §12 Phase 7).
    Scans the whole platform, not just this admin's org, matching the
    worker's own scope.
    """
    result = await run_alert_scan(db)
    await db.commit()
    return AlertScanResponse(
        statuses_recomputed=result.statuses_recomputed,
        alerts_sent=result.alerts_sent,
        alerts_failed=result.alerts_failed,
        alerts_skipped_duplicate=result.alerts_skipped_duplicate,
    )


@router.get("/llm-usage", response_model=list[LLMUsageSummary])
async def get_llm_usage(
    db: DbSession,
    current_user: Annotated[User, Depends(require_role(UserRole.ADMIN))],
) -> list[LLMUsageSummary]:
    """Today's Groq/Gemini quota usage, for ops visibility
    (docs/CONTRACT_CLM_BUILD_PLAN.md §8). Usage is platform-wide, not
    per-org — quota is consumed against one shared set of provider API
    keys, not allocated per tenant."""
    summaries = await quota.get_usage_summary(db)
    return [
        LLMUsageSummary(
            provider=s.provider,
            date=s.date,
            requests_used=s.requests_used,
            tokens_used=s.tokens_used,
            requests_limit=s.requests_limit,
            tokens_limit=s.tokens_limit,
            has_headroom=s.has_headroom,
        )
        for s in summaries
    ]
