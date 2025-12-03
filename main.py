from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import albums, photos, auth, friends, users, notifications  # ✅ ADD NOTIFICATIONS AQUI

app = FastAPI(title="NapSe Beta API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ REGISTRO DAS ROTAS
app.include_router(auth.router)
app.include_router(albums.router)
app.include_router(photos.router)
app.include_router(friends.router)      # ✅ AMIZADES
app.include_router(users.router)        # ✅ BUSCA DE USUÁRIOS
app.include_router(notifications.router)  # ✅ NOTIFICAÇÕES (ESSENCIAL)

@app.get("/")
def root():
    return {
        "status": "NapSe Beta API ONLINE",
        "version": "0.1.0"
    }
