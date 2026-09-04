from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, require_role
from app.db.enums import UserRole
from app.db.models import User
from app.schemas.alert import AlertScanResponse
from app.services.alerts import run_alert_scan

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
