"""
Модуль интерпретируемости рекомендаций (Explainable AI, XAI)
и генерации целевого следующего шага (Next Step).
"""

import os
from backend.app.models.schemas import (
    Material,
    UserProfile,
    RecommendationExplanation,
    BusinessStage,
    PriceType,
    MaterialFormat,
)


class ExplainabilityEngine:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")

    def generate_explanation(
        self,
        material: Material,
        profile: UserProfile,
        relevance_score: float,
        stage_fit_score: float,
    ) -> RecommendationExplanation:
        """
        Генерирует понятное предпринимателю обоснование рекомендации
        и следующий шаг на платформе «Альфа-Курс».
        """
        fit_factors: list[str] = []

        # 1. Формирование факторов соответствия
        stage_names = {
            BusinessStage.IDEA_AND_LAUNCH: "Старт и запуск дела",
            BusinessStage.EARLY_STAGE: "Первые клиенты и продажи",
            BusinessStage.GROWTH: "Масштабирование и команда",
            BusinessStage.CRISIS: "Оптимизация и кассовый разрыв",
        }

        if profile.stage:
            stage_desc = stage_names.get(profile.stage, "Ваша текущая стадия")
            fit_factors.append(f"Точно соответствует стадии: {stage_desc}")
        else:
            fit_factors.append("Универсальный вводный материал для любого бизнеса")

        format_names = {
            MaterialFormat.CHECKLIST: f"Быстрый чек-лист ({material.effort_minutes} мин) — практический результат сегодня",
            MaterialFormat.TEMPLATE: f"Готовый шаблон ({material.effort_minutes} мин) — можно сразу внедрить",
            MaterialFormat.GUIDE: f"Пошаговый гайд ({material.effort_minutes} мин) без сложной терминологии",
            MaterialFormat.VIDEO_INTENSIVE: f"Видео-интенсив ({material.effort_minutes} мин) с разбором практики",
            MaterialFormat.DEEP_COURSE: f"Системный курс ({material.effort_minutes // 60} ч) с получением компетенции",
        }
        fit_factors.append(format_names.get(material.format, "Практический формат"))

        if material.price_type == PriceType.FREE:
            fit_factors.append("Бесплатный инструмент от экспертов Альфа-Банка")
        else:
            fit_factors.append(f"Углубленный платный продукт ({material.price_rub} ₽) с готовыми шаблонами")

        # 2. Формирование текста обоснования (Why Recommended)
        why_text = self._build_why_text(material, profile)

        # 3. Определение следующего шага (Next Step)
        next_step_text, next_mat_id = self._build_next_step(material, profile)

        return RecommendationExplanation(
            why_recommended=why_text,
            fit_factors=fit_factors,
            next_step=next_step_text,
            suggested_next_material_id=next_mat_id,
        )

    def _build_why_text(self, material: Material, profile: UserProfile) -> str:
        """Построение емкого человечного обоснования подбора."""
        task_snippet = (
            f"под вашу задачу «{profile.current_task[:60]}...»"
            if profile.current_task
            else "для формирования надежного бизнес-фундамента"
        )

        if material.format in [MaterialFormat.CHECKLIST, MaterialFormat.TEMPLATE]:
            return (
                f"Рекомендовано {task_snippet}. Этот {material.format.value} позволит закрыть вопрос за "
                f"{material.effort_minutes} минут без привлечения дорогих юристов и бухгалтеров."
            )
        elif material.price_type == PriceType.PAID:
            return (
                f"Рекомендовано для глубокого решения задачи. Курс содержит готовые методики и предостерегает от "
                f"финансовых ошибок, которые могут стоить бизнесу сотен тысяч рублей штрафов."
            )
        else:
            return (
                f"Материал отобран {task_snippet}. Позволяет быстро разобраться в ключевых моментах "
                f"и избежать типичных ошибок предпринимателей на старте."
            )

    def _build_next_step(
        self,
        material: Material,
        profile: UserProfile,
    ) -> tuple[str, str | None]:
        """Определение следующего логического шага в образовательной траектории."""
        next_mat_id: str | None = None

        if material.next_material_ids:
            next_mat_id = material.next_material_ids[0]

        if material.price_type == PriceType.FREE and next_mat_id:
            next_step_text = (
                f"Шаг 1: Примените этот материал на практике. "
                f"Шаг 2: Для системного закрепления перейдите к углубленному курсу платформы «Альфа-Курс»."
            )
        elif material.format == MaterialFormat.CHECKLIST:
            next_step_text = "Изучите пункты чек-листа, отметьте выполненное и перейдите к выбору подходящего режима налогообложения."
        elif material.format == MaterialFormat.TEMPLATE:
            next_step_text = "Скачайте шаблон, заполните данные вашей компании и настройте еженедельный мониторинг показателей."
        else:
            next_step_text = "После завершения курса сдайте итоговый тест и внедрите полученные регламенты в бизнес."

        return next_step_text, next_mat_id


explainability_engine = ExplainabilityEngine()
