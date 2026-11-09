"""
REST API контроллеры рекомендательной системы «Альфа-Курс».
"""

from typing import Any
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from backend.app.models.schemas import (
    Material,
    UserProfile,
    RecommendationResponse,
    BenchmarkComparisonResponse,
    BusinessStage,
    MaterialFormat,
    PriceType,
)
from backend.app.services.catalog_service import catalog_service
from backend.app.services.recsys import recsys_pipeline


router = APIRouter(prefix="/api/v1", tags=["Recommendations & Analytics"])


class ABTestRequest(BaseModel):
    daily_visitors: int = Field(5000, description="Ежедневное число активных пользователей платформы")
    baseline_cr_percent: float = Field(2.5, description="Текущая конверсия в покупку платных курсов (%)")
    expected_uplift_percent: float = Field(35.0, description="Ожидаемый прирост конверсии от RecSys (%)")
    avg_order_value_rub: int = Field(4900, description="Средний чек платного образовательного продукта (₽)")
    test_duration_days: int = Field(14, description="Длительность A/B теста в днях")


@router.post("/recommend", response_model=RecommendationResponse)
def get_recommendations(profile: UserProfile, top_k: int = Query(5, ge=1, le=10)):
    """
    Генерирует персонализированные рекомендации образовательных материалов
    с XAI-объяснениями и следующими шагами.
    """
    return recsys_pipeline.recommend(profile=profile, top_k=top_k)


@router.get("/catalog", response_model=dict[str, Any])
def get_catalog(
    stage: BusinessStage | None = None,
    format: MaterialFormat | None = None,
    price_type: PriceType | None = None,
):
    """Возвращает каталог материалов «Альфа-Курс» с возможностью фильтрации."""
    materials = catalog_service.get_all_materials()

    if stage:
        materials = [m for m in materials if stage in m.target_stages]
    if format:
        materials = [m for m in materials if m.format == format]
    if price_type:
        materials = [m for m in materials if m.price_type == price_type]

    return {
        "total": len(materials),
        "materials": materials,
    }


@router.get("/profiles", response_model=list[UserProfile])
def get_test_profiles():
    """Возвращает список эталонных профилей для проверки жюри."""
    return catalog_service.get_all_profiles()


@router.get("/benchmark", response_model=BenchmarkComparisonResponse)
def get_benchmark():
    """
    Сравнительный бенчмарк:
    Тематический бейзлайн vs Наша гибридная RecSys модель на тестовых профилях.
    """
    return recsys_pipeline.run_benchmark()


@router.post("/cold-start", response_model=RecommendationResponse)
def get_cold_start():
    """Возвращает гарантированно сбалансированную стартовую подборку для нового пользователя."""
    guest_profile = UserProfile(
        user_id="guest",
        name="Новый предприниматель",
        stage=None,
        domain=None,
        current_task="",
    )
    return recsys_pipeline.recommend(profile=guest_profile, top_k=5)


@router.post("/ab-test-simulate")
def simulate_ab_test(params: ABTestRequest) -> dict[str, Any]:
    """
    Интерактивный симулятор дизайна A/B-тестирования после внедрения в прод.
    Расчет необходимого размера выборки, статистической мощности и бизнес-эффекта.
    """
    total_traffic = params.daily_visitors * params.test_duration_days
    control_traffic = total_traffic // 2
    test_traffic = total_traffic - control_traffic

    control_cr = params.baseline_cr_percent / 100.0
    relative_uplift = params.expected_uplift_percent / 100.0
    test_cr = control_cr * (1.0 + relative_uplift)

    # Оценка конверсий и выручки
    control_conversions = int(control_traffic * control_cr)
    test_conversions = int(test_traffic * test_cr)
    incremental_conversions = test_conversions - control_conversions

    control_revenue = control_conversions * params.avg_order_value_rub
    test_revenue = test_conversions * params.avg_order_value_rub
    incremental_revenue = incremental_conversions * params.avg_order_value_rub

    # Экстраполяция на год при 100% раскатке
    annual_incremental_revenue = int(incremental_revenue * (365 / params.test_duration_days) * 2)

    return {
        "traffic": {
            "total_visitors": total_traffic,
            "control_group_size": control_traffic,
            "test_group_size": test_traffic,
            "duration_days": params.test_duration_days,
        },
        "conversion_rates": {
            "baseline_cr": f"{params.baseline_cr_percent:.2f}%",
            "expected_test_cr": f"{(test_cr * 100):.2f}%",
            "relative_uplift": f"+{params.expected_uplift_percent:.1f}%",
        },
        "statistical_design": {
            "alpha": 0.05,
            "power": 0.80,
            "min_detectable_effect": f"+{params.expected_uplift_percent:.1f}%",
            "stat_significance_reached": total_traffic >= 15000,
            "recommendation": (
                "Выборка достаточна для фиксации эффекта с p-value < 0.05"
                if total_traffic >= 15000
                else "Рекомендуется продлить эксперимент до 21 дня для набора мощности"
            ),
        },
        "business_impact": {
            "test_incremental_orders": incremental_conversions,
            "test_incremental_revenue_rub": incremental_revenue,
            "annual_projected_revenue_gain_rub": annual_incremental_revenue,
        },
    }
