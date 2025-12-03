from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from app.core.database import supabase
from app.core.security import get_current_user
import uuid

router = APIRouter(prefix="/photos", tags=["photos"])


# ======================================
# ✅ UPLOAD DE FOTO (COM AUTH ✅)
# ✅ POST /photos/upload
# ======================================
@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    caption: str = Form(""),
    album_id: str = Form(...),  # ✅ UUID do álbum
    user_id: str = Depends(get_current_user),
):
    try:
        print("🟡 RECEBIDO POST /photos/upload")
        print(f"📦 album_id={album_id}, user_id={user_id}, caption={caption}")

        # ✅ Gera nome único
        file_ext = (file.filename or "jpg").split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"

        content = await file.read()
        file_path = f"albums/{album_id}/{file_name}"

        # ✅ Upload para o Supabase Storage
        print("⬆️ Fazendo upload para Supabase Storage...")
        upload_res = supabase.storage.from_("photos").upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type or "image/jpeg"}
        )
        print("🟢 Upload Storage OK:", upload_res)

        # ✅ URL pública
        image_url = supabase.storage.from_("photos").get_public_url(file_path)
        print("🔗 URL pública:", image_url)

        if not image_url:
            raise HTTPException(
                status_code=500,
                detail="Não foi possível gerar URL pública"
            )

        data = {
            "album_id": album_id,
            "image_url": image_url,
            "caption": caption,
            "user_id": user_id,
        }

        res = supabase.table("photos").insert(data).execute()
        print("🟢 INSERT na tabela photos:", res)

        if not res.data:
            raise HTTPException(
                status_code=400,
                detail="Erro ao salvar no banco"
            )

        return res.data[0]

    except Exception as e:
        print("❌ ERRO UPLOAD FOTO:", e)
        raise HTTPException(status_code=500, detail=str(e))


# ======================================
# ✅ LISTAR FOTOS (GERAL OU POR ÁLBUM)
# ✅ GET /photos   (SEM BARRA FINAL)
# ======================================
@router.get("")
def list_photos(
    album_id: str = Query(None),
    user_id: str = Depends(get_current_user),
):
    try:
        print("📥 GET /photos | album_id =", album_id)

        query = (
            supabase
            .table("photos")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
        )

        if album_id:
            query = query.eq("album_id", album_id)

        res = query.execute()

        print(f"🟢 {len(res.data or [])} fotos retornadas")
        return res.data or []

    except Exception as e:
        print("❌ ERRO AO LISTAR FOTOS:", e)
        raise HTTPException(status_code=500, detail=str(e))
