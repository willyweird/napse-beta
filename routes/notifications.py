from fastapi import APIRouter, Depends
from app.core.database import supabase
from app.core.security import get_current_user  # ✅ IMPORT CORRETO

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ✅ LISTAR NOTIFICAÇÕES DO USUÁRIO (SEM BARRA FINAL)
@router.get("")
def list_notifications(user_id: str = Depends(get_current_user)):
    res = (
        supabase.table("notifications")
        .select("*, from_user:from_user_id(id, username, avatar_url)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    return res.data or []


# ✅ MARCAR UMA COMO LIDA
@router.post("/read/{notification_id}")
def mark_as_read(
    notification_id: str,
    user_id: str = Depends(get_current_user),
):
    supabase.table("notifications").update(
        {"read": True}
    ).eq("id", notification_id).eq("user_id", user_id).execute()

    return {"status": "ok"}


# ✅ MARCAR TODAS COMO LIDAS
@router.post("/read-all")
def mark_all_as_read(user_id: str = Depends(get_current_user)):
    supabase.table("notifications").update(
        {"read": True}
    ).eq("user_id", user_id).execute()

    return {"status": "ok"}
