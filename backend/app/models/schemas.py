"""
Pydantic-схемы данных платформы «Альфа-Курс» и рекомендательной системы.
"""

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class BusinessStage(str, Enum):
    IDEA_AND_LAUNCH = "idea_and_launch"  # Старт / выбор формы / первые шаги
    EARLY_STAGE = "early_stage"          # Первые клиенты / настройка процессов
    GROWTH = "growth_and_scaling"        # Масштабирование / команда / финучет
    CRISIS = "crisis_and_turnaround"    # Кассовый разрыв / кризис / реорганизация


class BusinessDomain(str, Enum):
    ALL = "all"
    RETAIL = "retail"
    SERVICES = "services"
    HORECA = "horeca"                    # Кафе / кофейни / рестораны
    ECOMMERCE = "ecommerce"              # Маркетплейсы / интернет-магазины
    IT_AND_DIGITAL = "it_and_digital"
    PRODUCTION = "production"


class MaterialFormat(str, Enum):
    CHECKLIST = "checklist"              # Быстрый чек-лист (5-10 мин)
    TEMPLATE = "template"                # Готовый шаблон документа (15 мин)
    GUIDE = "guide"                      # Практическая статья/гайд (15-20 мин)
    VIDEO_INTENSIVE = "video_intensive"  # Интенсивный видеоурок (30-60 мин)
    DEEP_COURSE = "deep_course"          # Полноценный курс (3-10 часов)


class PriceType(str, Enum):
    FREE = "free"
    PAID = "paid"


class Material(BaseModel):
    id: str = Field(..., description="Уникальный идентификатор материала")
    title: str = Field(..., description="Название материала")
    description: str = Field(..., description="Краткое описание содержания")
    format: MaterialFormat = Field(..., description="Формат материала")
    price_type: PriceType = Field(..., description="Бесплатный или платный")
    price_rub: int = Field(0, description="Стоимость в рублях (0 для бесплатных)")
    effort_minutes: int = Field(..., description="Примерное время на изучение")
    target_stages: list[BusinessStage] = Field(..., description="Целевые стадии бизнеса")
    target_domains: list[BusinessDomain] = Field(..., description="Целевые сферы бизнеса")
    topics: list[str] = Field(default_factory=list, description="Ключевые теги и темы")
    prerequisites: list[str] = Field(default_factory=list, description="ID материалов, которые желательно изучить до этого")
    next_material_ids: list[str] = Field(default_factory=list, description="Рекомендуемые следующие шаги (ID курсов)")
    key_takeaways: list[str] = Field(default_factory=list, description="Что предприниматель получит на выходе")
    alfa_link: str = Field(..., description="Ссылка на платформу «Альфа-Курс»")
    rating: float = Field(4.8, description="Рейтинг материала на платформе")
    popularity_score: int = Field(100, description="Метрика популярности (число завершений)")


class UserProfile(BaseModel):
    user_id: str = Field("guest", description="ID пользователя")
    name: str = Field("Предприниматель", description="Имя пользователя")
    stage: BusinessStage | None = Field(None, description="Стадия бизнеса")
    domain: BusinessDomain | None = Field(None, description="Сфера деятельности")
    current_task: str = Field("", description="Текущая задача или проблема своими словами")
    experience_years: float = Field(0.0, description="Опыт в бизнесе в годах")
    view_history: list[str] = Field(default_factory=list, description="ID просмотренных материалов")
    completed_materials: list[str] = Field(default_factory=list, description="ID пройденных курсов/шаблонов")


class RecommendationExplanation(BaseModel):
    why_recommended: str = Field(..., description="Обоснование подбора под профиль и задачу")
    fit_factors: list[str] = Field(default_factory=list, description="Факторы соответствия (стадия, формат, польза)")
    next_step: str = Field(..., description="Рекомендуемый следующий шаг после изучения")
    suggested_next_material_id: str | None = Field(None, description="ID следующего рекомендуемого курса")


class ScoredRecommendation(BaseModel):
    material: Material
    score: float = Field(..., description="Итоговый скор ранжирования [0..1]")
    relevance_score: float = Field(..., description="Семантическое соответствие задаче")
    stage_fit_score: float = Field(..., description="Соответствие стадии бизнеса")
    funnel_score: float = Field(..., description="Скор ценности в воронке монетизации")
    explanation: RecommendationExplanation


class RecommendationResponse(BaseModel):
    profile_summary: str = Field(..., description="Интерпретация профиля пользователя")
    is_cold_start: bool = Field(False, description="Применен ли режим холодного старта")
    recommendations: list[ScoredRecommendation] = Field(default_factory=list)
    total_found: int = 0


class ProfileBenchmarkResult(BaseModel):
    profile_id: str
    profile_name: str
    task_description: str
    stage: str
    baseline_recommendations: list[str]
    model_recommendations: list[str]
    baseline_stage_match_rate: float
    model_stage_match_rate: float
    baseline_ndcg_at_5: float
    model_ndcg_at_5: float
    baseline_precision_at_5: float
    model_precision_at_5: float
    baseline_issues: list[str]
    model_advantages: list[str]


class BenchmarkComparisonResponse(BaseModel):
    summary: dict[str, Any]
    profiles: list[ProfileBenchmarkResult]
