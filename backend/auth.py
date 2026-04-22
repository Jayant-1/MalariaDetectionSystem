"""
Auth dependency for FastAPI.

Supabase-specific JWT verification has been removed.
Behavior is now controlled by environment:

- AUTH_MODE=optional (default): requests are allowed without token
- AUTH_MODE=required: bearer token is required and validated with JWT_SECRET
"""

import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

load_dotenv()

AUTH_MODE = os.getenv("AUTH_MODE", "optional").strip().lower()
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "")

security = HTTPBearer(auto_error=False)


def _decode_token(token: str) -> dict:
    if not JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET is not configured",
        )

    options = {"verify_aud": bool(JWT_AUDIENCE)}
    decode_kwargs = {"algorithms": [JWT_ALGORITHM], "options": options}
    if JWT_AUDIENCE:
        decode_kwargs["audience"] = JWT_AUDIENCE

    try:
        payload = jwt.decode(token, JWT_SECRET, **decode_kwargs)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    return {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role"),
        "raw": payload,
    }


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """
    Return authenticated user info when possible.

    In optional mode, missing/invalid token does not block requests.
    """
    if not credentials:
        if AUTH_MODE == "required":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authentication token",
            )
        return {"user_id": None, "email": None, "role": "anonymous", "raw": {}}

    return _decode_token(credentials.credentials)

