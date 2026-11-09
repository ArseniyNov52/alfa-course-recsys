"""
Сервис доступа к каталогу образовательных материалов и тестовым профилям.
"""

import json
from pathlib import Path
from backend.app.models.schemas import Material, UserProfile


class CatalogService:
    def __init__(self, catalog_path: Path | None = None, profiles_path: Path | None = None):
        base_dir = Path(__file__).resolve().parent.parent / "data"
        self.catalog_path = catalog_path or (base_dir / "catalog.json")
        self.profiles_path = profiles_path or (base_dir / "test_profiles.json")
        self._materials: dict[str, Material] = {}
        self._profiles: dict[str, UserProfile] = {}
        self.load_data()

    def load_data(self) -> None:
        """Загрузка каталога и профилей из JSON файлов."""
        if self.catalog_path.exists():
            with open(self.catalog_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._materials = {item["id"]: Material(**item) for item in data}

        if self.profiles_path.exists():
            with open(self.profiles_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._profiles = {p["user_id"]: UserProfile(**p) for p in data}

    def get_all_materials(self) -> list[Material]:
        """Возвращает все материалы каталога."""
        return list(self._materials.values())

    def get_material_by_id(self, material_id: str) -> Material | None:
        """Получить материал по ID."""
        return self._materials.get(material_id)

    def get_all_profiles(self) -> list[UserProfile]:
        """Возвращает все тестовые профили."""
        return list(self._profiles.values())

    def get_profile_by_id(self, profile_id: str) -> UserProfile | None:
        """Получить профиль по ID."""
        return self._profiles.get(profile_id)


# Глобальный синглтон сервиса
catalog_service = CatalogService()
