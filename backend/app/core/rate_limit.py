"""IP-based rate limiting for auth endpoints — a basic defense against
credential stuffing / brute force. See docs/CONTRACT_CLM_BUILD_PLAN.md §6.8.
"""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import InvalidTokenError, TokenType, decode_token

limiter = Limiter(key_func=get_remote_address)


def chat_rate_limit_key(request: Request) -> str:
    """Per-user rather than per-IP (docs/CHATBOT_INTEGRATION_PLAN.md §6.3)
    — chat is authenticated, so limiting by user rather than by the IP an
    office full of users all share is the meaningful control. Decodes the
    request's own bearer token independently of the `CurrentUser`
    dependency, since slowapi evaluates its key_func before FastAPI's
    dependency injection resolves; falls back to IP if that ever fails
    (defensive only — every route this key_func is used on already
    requires a valid token to reach its handler at all)."""
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        try:
            decoded = decode_token(auth_header[7:], expected_type=TokenType.ACCESS)
            return str(decoded.user_id)
        except InvalidTokenError:
            pass
    return get_remote_address(request)
