from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status, Header
from jose import jwt, JWTError, ExpiredSignatureError
from passlib.context import CryptContext

from app.core.config import SECRET_KEY, ALGORITHM


# ======================================================
# ✅ CONFIG
# ======================================================

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7   # 7 dias
REFRESH_TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# ======================================================
# ✅ PASSWORD
# ======================================================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(password, hashed_password)
    except Exception:
        return False


# ======================================================
# ✅ JWT - ACCESS TOKEN
# ======================================================

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
        "iat": datetime.utcnow(),
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ======================================================
# ✅ JWT - REFRESH TOKEN (ÚNICO LOCAL OFICIAL)
# ======================================================

def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh",
        "iat": datetime.utcnow(),
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ======================================================
# ✅ AUTH GUARD ÚNICO (100% BLINDADO)
# ======================================================

def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header ausente",
        )

    try:
        parts = authorization.split(" ")

        if len(parts) != 2:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Header de autorização malformado",
            )

        scheme, token = parts

        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Esquema de autorização inválido",
            )

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        token_type: Optional[str] = payload.get("type")
        user_id: Optional[str] = payload.get("sub")

        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tipo de token inválido",
            )

        if not user_id or not isinstance(user_id, str):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token sem usuário válido",
            )

        return user_id

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado",
        )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
