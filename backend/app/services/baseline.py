"""
Простой бейзлайн (Baseline Recommender):
подбор исключительно по совпадению тем/ключевых слов (Keyword/Topic Overlap)
и глобальной популярности, без учета стадии бизнеса, опыта и воронки.
"""

from backend.app.models.schemas import Material, UserProfile


class TopicBaselineRecommender:
    def __init__(self, materials: list[Material]):
        self.materials = materials

    def recommend(self, profile: UserProfile, top_k: int = 5) -> list[tuple[Material, float]]:
        """
        Простой подбор:
        Счетчик совпадений слов из current_task с названиями и тегами материалов
        + нормализованная популярность.
        НЕ учитывает stage, domain, prerequisites и воронку.
        """
        task_words = set(profile.current_task.lower().split()) if profile.current_task else set()

        scored: list[tuple[Material, float]] = []

        for m in self.materials:
            match_count = 0
            # Проверка совпадения по темам
            for topic in m.topics:
                for word in task_words:
                    if len(word) > 3 and word in topic.lower():
                        match_count += 2

            # Проверка совпадения по названию
            title_lower = m.title.lower()
            for word in task_words:
                if len(word) > 3 and word in title_lower:
                    match_count += 3

            # Скор популярности
            popularity_component = m.popularity_score / 3500.0

            # Бейзлайн скор
            score = float(match_count * 0.7 + popularity_component * 0.3)
            scored.append((m, score))

        # Сортировка по убыванию скора бейзлайна
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]
