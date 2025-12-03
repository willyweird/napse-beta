from fastapi import APIRouter, HTTPException, status, Depends
from app.core.security import get_current_user
from app.core.database import supabase

router = APIRouter(prefix="/albums", tags=["albums"])


# ✅ GET /albums - Listar álbuns do usuário (SEM BARRA FINAL)
@router.get("")
def get_albums(user_id: str = Depends(get_current_user)):
    """Lista todos os álbuns do usuário autenticado"""
    try:
        result = (
            supabase
            .table("albums")
            .select("*")
            .eq("owner_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    except Exception as e:
        print(f"❌ Erro ao buscar álbuns: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar álbuns"
        )


# ✅ POST /albums - Criar álbum (SEM BARRA FINAL)
@router.post("", status_code=status.HTTP_201_CREATED)
def create_album(data: dict, user_id: str = Depends(get_current_user)):
    """Cria um novo álbum"""
    title = data.get("title")
    cover_url = data.get("cover_url")

    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Título é obrigatório"
        )

    try:
        result = (
            supabase
            .table("albums")
            .insert({
                "title": title,
                "cover_url": cover_url,
                "owner_id": user_id
            })
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erro ao criar álbum"
            )

        return result.data[0]

    except Exception as e:
        print(f"❌ Erro ao criar álbum: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar álbum"
        )


# ✅ GET /albums/{album_id} - Buscar álbum específico
@router.get("/{album_id}")
def get_album(album_id: str, user_id: str = Depends(get_current_user)):
    """Busca um álbum específico"""
    try:
        result = (
            supabase
            .table("albums")
            .select("*")
            .eq("id", album_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Álbum não encontrado"
            )

        return result.data

    except Exception as e:
        print(f"❌ Erro ao buscar álbum: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar álbum"
        )


# ✅ DELETE /albums/{album_id} - Deletar álbum
@router.delete("/{album_id}")
def delete_album(album_id: str, user_id: str = Depends(get_current_user)):
    """Deleta um álbum (apenas o dono pode deletar)"""
    try:
        album = (
            supabase
            .table("albums")
            .select("*")
            .eq("id", album_id)
            .eq("owner_id", user_id)
            .single()
            .execute()
        )

        if not album.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Álbum não encontrado ou você não tem permissão"
            )

        supabase.table("albums").delete().eq("id", album_id).execute()

        return {"success": True, "message": "Álbum deletado"}

    except Exception as e:
        print(f"❌ Erro ao deletar álbum: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao deletar álbum"
        )
