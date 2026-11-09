"""
Точка входа FastAPI сервера «Альфа-Курс: Рекомендательная система».
"""

from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.api.routes import router as api_router


app = FastAPI(
    title="Альфа-Курс: Рекомендательная система",
    description="Персональные рекомендации образовательных материалов для малого бизнеса (Трек 1, Hack&Change 2026)",
    version="1.0.0",
)

# Настройка CORS для взаимодействия с локальным и Docker фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение API роутов
app.include_router(api_router)


@app.get("/health", tags=["System"])
def health_check():
    """Проверка доступности сервиса."""
    return {"status": "ok", "service": "alfa-course-recsys", "version": "1.0.0"}


# Подключение собранного SPA-фронтенда
frontend_dist_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if frontend_dist_path.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dist_path / "assets"), name="assets")

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_spa(full_path: str):
        file_path = frontend_dist_path / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist_path / "index.html")
