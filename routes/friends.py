from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List

from app.core.database import supabase
from app.core.security import get_current_user


router = APIRouter(prefix="/friends", tags=["friends"])


# ========= SCHEMAS =========

class FriendUser(BaseModel):
    id: str
    username: str
    email: str | None = None
    avatar_url: str | None = None


class Friend(BaseModel):
    id: str
    friend: FriendUser


class FriendRequestOut(BaseModel):
    id: str
    from_user: FriendUser
    status: str


class FriendRequestCreate(BaseModel):
    to_user_id: str


class FriendRequestAction(BaseModel):
    request_id: str


# ========= LISTAR AMIGOS =========
# ✅ GET /friends  (SEM BARRA FINAL)
@router.get("", response_model=List[Friend])
def list_friends(user_id: str = Depends(get_current_user)):
    friends_res = (
        supabase.table("friends")
        .select("id, friend_id")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )

    friends = friends_res.data or []
    friend_ids = [f["friend_id"] for f in friends]

    if not friend_ids:
        return []

    users_res = (
        supabase.table("users")
        .select("id, username, email, avatar_url")
        .in_("id", friend_ids)
        .execute()
    )

    users_by_id = {u["id"]: u for u in (users_res.data or [])}

    result: List[Friend] = []

    for f in friends:
        friend_user = users_by_id.get(f["friend_id"])
        if friend_user:
            result.append(
                Friend(
                    id=f["id"],
                    friend=FriendUser(**friend_user),
                )
            )

    return result


# ========= ENVIAR PEDIDO DE AMIZADE =========
@router.post("/request", status_code=status.HTTP_201_CREATED)
def send_friend_request(
    payload: FriendRequestCreate,
    user_id: str = Depends(get_current_user),
):
    try:
        from_user_id = user_id
        to_user_id = payload.to_user_id

        if from_user_id == to_user_id:
            raise HTTPException(status_code=400, detail="Você não pode se adicionar.")

        already_friends = (
            supabase
            .table("friends")
            .select("id")
            .or_(
                f"and(user_id.eq.{from_user_id},friend_id.eq.{to_user_id}),"
                f"and(user_id.eq.{to_user_id},friend_id.eq.{from_user_id})"
            )
            .execute()
        )

        if already_friends and already_friends.data:
            raise HTTPException(status_code=400, detail="Vocês já são amigos.")

        existing_req = (
            supabase
            .table("friend_requests")
            .select("id, status")
            .eq("from_user_id", from_user_id)
            .eq("to_user_id", to_user_id)
            .eq("status", "pending")
            .execute()
        )

        if existing_req and existing_req.data:
            raise HTTPException(status_code=400, detail="Pedido já enviado.")

        res = (
            supabase.table("friend_requests")
            .insert(
                {
                    "from_user_id": from_user_id,
                    "to_user_id": to_user_id,
                    "status": "pending",
                }
            )
            .execute()
        )

        supabase.table("notifications").insert({
            "user_id": to_user_id,
            "from_user_id": from_user_id,
            "type": "friend_request",
            "message": "te enviou um pedido de amizade"
        }).execute()

        return {
            "status": "ok",
            "request_id": res.data[0]["id"] if res.data else None,
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print("🔥 ERRO REAL NO FRIEND REQUEST:", e)
        raise HTTPException(
            status_code=500, detail="Erro ao enviar pedido de amizade"
        )


# ========= LISTAR PEDIDOS RECEBIDOS =========
@router.get("/requests", response_model=List[FriendRequestOut])
def list_friend_requests(user_id: str = Depends(get_current_user)):
    reqs_res = (
        supabase.table("friend_requests")
        .select("id, from_user_id, status, created_at")
        .eq("to_user_id", user_id)
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )

    requests = reqs_res.data or []
    from_ids = [r["from_user_id"] for r in requests]

    if not from_ids:
        return []

    users_res = (
        supabase.table("users")
        .select("id, username, email, avatar_url")
        .in_("id", from_ids)
        .execute()
    )

    users_by_id = {u["id"]: u for u in (users_res.data or [])}

    result: List[FriendRequestOut] = []

    for r in requests:
        from_user = users_by_id.get(r["from_user_id"])
        if from_user:
            result.append(
                FriendRequestOut(
                    id=r["id"],
                    from_user=FriendUser(**from_user),
                    status=r["status"],
                )
            )

    return result


# ========= ACEITAR PEDIDO =========
@router.post("/accept")
def accept_friend_request(
    payload: FriendRequestAction,
    user_id: str = Depends(get_current_user),
):
    req_res = (
        supabase.table("friend_requests")
        .select("*")
        .eq("id", payload.request_id)
        .single()
        .execute()
    )

    request = req_res.data

    if not request:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")

    if request["to_user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Não autorizado.")

    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Pedido já processado.")

    from_user_id = request["from_user_id"]
    to_user_id = request["to_user_id"]

    supabase.table("friends").insert(
        [
            {"user_id": from_user_id, "friend_id": to_user_id},
            {"user_id": to_user_id, "friend_id": from_user_id},
        ]
    ).execute()

    supabase.table("friend_requests").update(
        {"status": "accepted"}
    ).eq("id", payload.request_id).execute()

    supabase.table("notifications").insert({
        "user_id": from_user_id,
        "from_user_id": to_user_id,
        "type": "friend_accept",
        "message": "aceitou sua solicitação de amizade"
    }).execute()

    return {"status": "ok"}


# ========= RECUSAR PEDIDO =========
@router.post("/reject")
def reject_friend_request(
    payload: FriendRequestAction,
    user_id: str = Depends(get_current_user),
):
    req_res = (
        supabase.table("friend_requests")
        .select("*")
        .eq("id", payload.request_id)
        .single()
        .execute()
    )

    request = req_res.data

    if not request:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")

    if request["to_user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Não autorizado.")

    if request["status"] != "pending":
        raise HTTPException(status_code=400, detail="Pedido já processado.")

    supabase.table("friend_requests").update(
        {"status": "rejected"}
    ).eq("id", payload.request_id).execute()

    return {"status": "ok"}


# ========= REMOVER AMIGO =========
@router.delete("/{friend_id}")
def remove_friend(
    friend_id: str,
    user_id: str = Depends(get_current_user),
):
    supabase.table("friends").delete().match(
        {"user_id": user_id, "friend_id": friend_id}
    ).execute()

    supabase.table("friends").delete().match(
        {"user_id": friend_id, "friend_id": user_id}
    ).execute()

    return {"status": "ok"}


# ========= LISTAR PEDIDOS ENVIADOS =========
@router.get("/sent")
def list_sent_requests(user_id: str = Depends(get_current_user)):
    res = (
        supabase
        .table("friend_requests")
        .select("id, to_user_id, status")
        .eq("from_user_id", user_id)
        .eq("status", "pending")
        .execute()
    )

    return res.data or []
