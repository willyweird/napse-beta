from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.database import supabase
from app.core.security import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


# ======================================
# ✅ BUSCAR USUÁRIOS PELO USERNAME
# ✅ GET /users/search?q=texto
# ======================================
@router.get("/search")
def search_users(
    q: str = Query(..., min_length=2, max_length=50),
    user_id: str = Depends(get_current_user),
):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Busca inválida")

    try:
        res = (
            supabase
            .table("users")
            .select("id, username, email, avatar_url")
            .ilike("username", f"%{q}%")
            .neq("id", user_id)  # ✅ não retorna o próprio usuário
            .limit(20)
            .execute()
        )

        return res.data or []

    except Exception as e:
        print("❌ ERRO AO BUSCAR USUÁRIOS:", e)
        raise HTTPException(
            status_code=500,
            detail="Erro ao buscar usuários"
        )
