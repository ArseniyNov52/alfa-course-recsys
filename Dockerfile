# Multi-stage Dockerfile for Alfa-Course Recommender System

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python FastAPI Backend & Static Serving
FROM python:3.12-slim AS runner

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Создание непривилегированного пользователя appuser
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Копирование зависимостей и установка через pip
COPY pyproject.toml ./
RUN pip install --no-cache-dir \
    fastapi==0.162.2 \
    uvicorn==0.54.0 \
    pydantic==2.14.3 \
    scikit-learn==1.9.1 \
    numpy==2.5.4 \
    scipy==1.18.1 \
    python-dotenv==1.2.4

# Копирование исходного кода бэкенда
COPY backend/ ./backend/

# Копирование собранного фронтенда в каталог dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Назначение прав пользователю
RUN chown -R appuser:appgroup /app
USER appuser

ENV PORT=8000
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
