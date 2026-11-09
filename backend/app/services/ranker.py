"""
Модуль многокритериального ранжирования (Multi-Objective Ranker)
с оптимизацией конверсии в платные продукты (Funnel Optimization).
"""

import math
from backend.app.models.schemas import (
    Material,
    UserProfile,
    BusinessStage,
    PriceType,
    MaterialFormat,
)


class MultiObjectiveRanker:
    def __init__(
        self,
        w_relevance: float = 0.40,
        w_stage: float = 0.30,
        w_funnel: float = 0.15,
        w_actionability: float = 0.15,
    ):
        self.w_relevance = w_relevance
        self.w_stage = w_stage
        self.w_funnel = w_funnel
        self.w_actionability = w_actionability

    def score_candidate(
        self,
        material: Material,
        semantic_sim: float,
        profile: UserProfile,
    ) -> tuple[float, float, float, float]:
        """
        Вычисляет компоненты скоринга для кандидата.
        Возвращает: (final_score, relevance_score, stage_fit_score, funnel_score)
        """
        # 1. Relevance Score
        relevance_score = max(0.0, min(1.0, semantic_sim))

        # 2. Stage Fit Score
        if profile.stage is None:
            # Холодный старт — отдаем предпочтение вводным и универсальным материалам
            if BusinessStage.IDEA_AND_LAUNCH in material.target_stages:
                stage_fit_score = 0.9
            else:
                stage_fit_score = 0.6
        elif profile.stage in material.target_stages:
            stage_fit_score = 1.0
        else:
            # Несовпадение стадии
            stage_fit_score = 0.15

        # 3. Funnel & Monetization Score
        # Логика воронки образовательной платформы:
        # - Если пользователь новичок или не изучал базу, первым делом предлагаем бесплатный
        #   шаблон/чек-лист (быстрый дофамин и решение задачи).
        # - Если в истории есть завершенные материалы или пользователь на стадии роста,
        #   увеличиваем скор платных углубленных курсов как следующего логического шага.
        has_studied_base = len(profile.completed_materials) > 0 or len(profile.view_history) > 1

        if material.price_type == PriceType.FREE:
            if not has_studied_base:
                # Новичку бесплатный инструмент важнее дорогого курса
                funnel_score = 0.95
            else:
                funnel_score = 0.75
        else:
            # Платный курс
            if has_studied_base or profile.stage == BusinessStage.GROWTH:
                # Платный курс имеет максимальную ценность для разогретого пользователя
                funnel_score = 0.90
            else:
                # Для холодного новичка платный курс не должен стоять на 1-м месте,
                # но должен быть в топ-3 или как следующий шаг
                funnel_score = 0.60

        # 4. Actionability & Novelty Score
        # Штраф за уже изученные материалы (не показываем то, что уже пройдено)
        if material.id in profile.completed_materials:
            novelty_penalty = 0.70
        elif material.id in profile.view_history:
            novelty_penalty = 0.30
        else:
            novelty_penalty = 0.0

        # Бонус за быстрый результат (чек-листы и шаблоны позволяют решить вопрос "сегодня")
        if material.format in [MaterialFormat.CHECKLIST, MaterialFormat.TEMPLATE]:
            quick_win_bonus = 0.20
        else:
            quick_win_bonus = 0.05

        # Нормализованная популярность
        pop_normalized = min(1.0, math.log1p(material.popularity_score) / 8.0)

        actionability_score = max(
            0.05,
            min(1.0, (0.5 * pop_normalized + 0.5 * quick_win_bonus) * (1.0 - novelty_penalty))
        )

        # Итоговый взвешенный скор
        final_score = (
            self.w_relevance * relevance_score
            + self.w_stage * stage_fit_score
            + self.w_funnel * funnel_score
            + self.w_actionability * actionability_score
        )

        return round(final_score, 4), round(relevance_score, 4), round(stage_fit_score, 4), round(funnel_score, 4)

    def rank_candidates(
        self,
        candidates: list[tuple[Material, float]],
        profile: UserProfile,
        top_k: int = 5,
    ) -> list[tuple[Material, float, float, float, float]]:
        """
        Ранжирует список кандидатов.
        Возвращает: [(material, final_score, rel_score, stage_score, funnel_score), ...]
        """
        ranked: list[tuple[Material, float, float, float, float]] = []

        for material, sim in candidates:
            final_s, rel_s, stage_s, fun_s = self.score_candidate(material, sim, profile)
            ranked.append((material, final_s, rel_s, stage_s, fun_s))

        # Сортировка по итоговому скору убывания
        ranked.sort(key=lambda x: x[1], reverse=True)
        return ranked[:top_k]
