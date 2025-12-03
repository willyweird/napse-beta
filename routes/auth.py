from fastapi import APIRouter, HTTPException, status
from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime
from pydantic import BaseModel

from app.core.config import SECRET_KEY, ALGORITHM
from app.core.database import supabase
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    hash_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# =========================
# SCHEMAS
# =========================

class LoginIn(BaseModel):
    email: str
    password: str


class SignupIn(BaseModel):
    username: str
    email: str
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


# =========================
# SIGNUP (SALVA password_hash)
# =========================
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(data: SignupIn):
    # ✅ verifica e-mail duplicado
    existing = (
        supabase
        .table("users")
        .select("id")
        .eq("email", data.email)
        .execute()
    )

    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já está em uso",
        )

    password_hash = hash_password(data.password)

    res = (
        supabase
        .table("users")
        .insert({
            "username": data.username,
            "email": data.email,
            "password_hash": password_hash,  # ✅ AGORA CORRETO
        })
        .execute()
    )

    if not res.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erro ao criar usuário",
        )

    user = {
        "id": res.data[0]["id"],
        "username": res.data[0]["username"],
        "email": res.data[0]["email"],
        "avatar_url": res.data[0].get("avatar_url"),
    }

    access_token = create_access_token(user["id"])
    refresh_token = create_refresh_token(user["id"])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
    }


# =========================
# LOGIN (USA password_hash)
# =========================
@router.post("/login")
def login(data: LoginIn):
    user_res = (
        supabase
        .table("users")
        .select("id, username, email, avatar_url, password_hash")  # ✅ AQUI
        .eq("email", data.email)
        .single()
        .execute()
    )

    if not user_res.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    user = user_res.data

    if not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário sem senha definida",
        )

    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    access_token = create_access_token(user["id"])
    refresh_token = create_refresh_token(user["id"])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "avatar_url": user.get("avatar_url"),
        },
    }


# =========================
# REFRESH TOKEN
# =========================
@router.post("/refresh")
def refresh(data: RefreshIn):
    try:
        payload = jwt.decode(
            data.refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh inválido",
            )

        # ✅ garante que usuário ainda existe
        user = (
            supabase
            .table("users")
            .select("id")
            .eq("id", user_id)
            .single()
            .execute()
        )

        if not user.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário não existe mais",
            )

        new_access = create_access_token(user_id)

        return {
            "access_token": new_access
        }

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expirado",
        )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido",
        )
