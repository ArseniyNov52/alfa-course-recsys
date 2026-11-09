"""
Модуль семантического поиска и первичного отбора кандидатов (Retrieval).
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.app.models.schemas import Material, UserProfile, BusinessStage, BusinessDomain


class SemanticRetrievalEngine:
    def __init__(self, materials: list[Material]):
        self.materials = materials
        self.material_ids = [m.id for m in materials]
        self.id_to_material = {m.id: m for m in materials}
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            token_pattern=r"(?u)\b\w+\b",
        )
        self._fit_corpus()

    def _fit_corpus(self) -> None:
        """Построение векторного индекса материалов."""
        corpus: list[str] = []
        for m in self.materials:
            # Обогащенный текстовый документ материала
            topics_str = " ".join(m.topics)
            domains_str = " ".join([d.value for d in m.target_domains])
            stages_str = " ".join([s.value for s in m.target_stages])
            takeaways_str = " ".join(m.key_takeaways)
            doc = f"{m.title} {m.description} {topics_str} {domains_str} {stages_str} {takeaways_str}"
            corpus.append(doc.lower())

        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    def retrieve_candidates(
        self,
        profile: UserProfile,
        top_k: int = 15,
    ) -> list[tuple[Material, float]]:
        """
        Отбор и предварительное семантическое ранжирование кандидатов с учетом стадии и сферы.
        Возвращает список кортежей (Material, similarity_score).
        """
        # 1. Формирование запроса из профиля
        query_parts: list[str] = []
        if profile.current_task:
            query_parts.append(profile.current_task)
        if profile.domain and profile.domain != BusinessDomain.ALL:
            query_parts.append(profile.domain.value)
        if profile.stage:
            query_parts.append(profile.stage.value)

        query = " ".join(query_parts).strip().lower()

        # Если запрос пустой (полный холодный старт)
        if not query:
            # Возвращаем материалы с наивысшим базовым рейтингом и универсальностью
            starter_candidates = [
                m for m in self.materials
                if BusinessStage.IDEA_AND_LAUNCH in m.target_stages or BusinessDomain.ALL in m.target_domains
            ]
            sorted_by_pop = sorted(starter_candidates, key=lambda x: x.popularity_score, reverse=True)
            return [(m, 0.5) for m in sorted_by_pop[:top_k]]

        # 2. Вычисление семантического сходства
        query_vec = self.vectorizer.transform([query])
        sim_scores = cosine_similarity(query_vec, self.tfidf_matrix)[0]

        scored_candidates: list[tuple[Material, float]] = []

        for idx, material in enumerate(self.materials):
            base_sim = float(sim_scores[idx])

            # Жесткий фильтр несовместимости стадий
            # Если пользователь новичок (idea_and_launch), блокируем продвинутые курсы масштабирования
            if profile.stage == BusinessStage.IDEA_AND_LAUNCH:
                if (
                    BusinessStage.GROWTH in material.target_stages
                    and BusinessStage.IDEA_AND_LAUNCH not in material.target_stages
                    and material.effort_minutes > 180
                ):
                    # Отсекаем сложный корпоративный курс для новичка
                    continue

            # Если пользователь уже на стадии масштабирования, не рекомендуем базовую регистрацию ИП,
            # если он сам явно не спросил об этом в current_task
            if profile.stage == BusinessStage.GROWTH:
                if (
                    material.id == "mat-001"
                    and "регистраци" not in profile.current_task.lower()
                ):
                    continue

            # Доменный бустинг
            domain_bonus = 0.0
            if profile.domain and profile.domain != BusinessDomain.ALL:
                if (
                    profile.domain in material.target_domains
                    or BusinessDomain.ALL in material.target_domains
                ):
                    domain_bonus = 0.15

            adjusted_sim = min(1.0, base_sim + domain_bonus)
            scored_candidates.append((material, adjusted_sim))

        # Сортировка по скору сходства
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        return scored_candidates[:top_k]
