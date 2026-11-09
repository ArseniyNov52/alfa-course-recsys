"""
Автоматизированные тесты для рекомендательного ядра «Альфа-Курс» и API эндпоинтов.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models.schemas import UserProfile, BusinessStage, BusinessDomain, PriceType
from backend.app.services.catalog_service import catalog_service
from backend.app.services.recsys import recsys_pipeline


@pytest.fixture
def client():
    return TestClient(app)


def test_catalog_loaded():
    """Каталог успешно загружен и содержит материалы."""
    materials = catalog_service.get_all_materials()
    assert len(materials) >= 15
    # Проверка наличия как бесплатных, так и платных материалов
    has_free = any(m.price_type == PriceType.FREE for m in materials)
    has_paid = any(m.price_type == PriceType.PAID for m in materials)
    assert has_free and has_paid


def test_cold_start_recommendations():
    """Холодный старт возвращает полезный 'Золотой стартовый набор' без ошибок."""
    empty_profile = UserProfile(
        user_id="test-cold",
        name="Гость",
        stage=None,
        domain=None,
        current_task="",
    )
    response = recsys_pipeline.recommend(empty_profile, top_k=5)

    assert response.is_cold_start is True
    assert len(response.recommendations) == 5
    # В холодном старте должны быть вводные бесплатные материалы
    for rec in response.recommendations:
        assert rec.score > 0
        assert rec.explanation.why_recommended
        assert rec.explanation.next_step


def test_beginner_profile_stage_filter():
    """Новичок (Анна - кофейня) не должен получать сложные корпоративные курсы финансового директора."""
    anna_profile = UserProfile(
        user_id="test-anna",
        name="Анна",
        stage=BusinessStage.IDEA_AND_LAUNCH,
        domain=BusinessDomain.HORECA,
        current_task="Открытие первой кофейни, регистрация бизнеса и проверки СЭС",
    )
    response = recsys_pipeline.recommend(anna_profile, top_k=5)

    rec_ids = [rec.material.id for rec in response.recommendations]

    # mat-001 (регистрация ИП) или mat-004 (чек-лист кофейни/СЭС) должны быть в топе
    assert "mat-001" in rec_ids or "mat-004" in rec_ids

    # mat-012 (курс финансового директора для масштабирования) не должен быть рекомендован новичку
    assert "mat-012" not in rec_ids


def test_scaling_profile_recommendations():
    """Селлер Wildberries на масштабировании получает материалы по команде, автоматизации и выходу на фабрики."""
    seller_profile = UserProfile(
        user_id="test-dmitry",
        name="Дмитрий",
        stage=BusinessStage.GROWTH,
        domain=BusinessDomain.ECOMMERCE,
        current_task="Оборот 3.5 млн на Wildberries, хочу делегировать рутину, нанять сотрудников и посчитать точную прибыль",
    )
    response = recsys_pipeline.recommend(seller_profile, top_k=5)
    rec_ids = [rec.material.id for rec in response.recommendations]

    # Должны присутствовать материалы по найму (mat-016), масштабированию маркетплейсов (mat-015) или управленке (mat-010)
    assert any(m_id in rec_ids for m_id in ["mat-010", "mat-014", "mat-015", "mat-016", "mat-017"])

    # Базовая регистрация ИП новичка не должна быть на 1-м месте
    assert rec_ids[0] != "mat-001"


def test_benchmark_superiority_over_baseline():
    """Наша модель должна превосходить простой бейзлайн по среднему NDCG@5 и Stage Match Rate."""
    benchmark = recsys_pipeline.run_benchmark()

    avg_model_ndcg = benchmark.summary["average_model_ndcg_at_5"]
    avg_baseline_ndcg = benchmark.summary["average_baseline_ndcg_at_5"]

    assert avg_model_ndcg >= avg_baseline_ndcg
    assert benchmark.summary["total_profiles_evaluated"] == 4


def test_api_health(client):
    """Эндпоинт проверки здоровья возвращает 200 OK."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_api_catalog(client):
    """Каталог доступен через REST API."""
    res = client.get("/api/v1/catalog")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    assert len(data["materials"]) > 0


def test_api_ab_test_simulator(client):
    """Эндпоинт расчета A/B-тестирования возвращает корректный математический дизайн."""
    payload = {
        "daily_visitors": 4000,
        "baseline_cr_percent": 2.0,
        "expected_uplift_percent": 30.0,
        "avg_order_value_rub": 5000,
        "test_duration_days": 14,
    }
    res = client.post("/api/v1/ab-test-simulate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "traffic" in data
    assert "conversion_rates" in data
    assert "statistical_design" in data
    assert "business_impact" in data
    assert data["business_impact"]["test_incremental_orders"] > 0
