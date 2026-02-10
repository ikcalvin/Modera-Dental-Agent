# ── Stage 1: Build ──────────────────────────────────────────────
FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Keep model downloads inside /app so they survive the multi-stage copy
ENV HF_HOME=/app/.cache/huggingface

# Install dependencies first (layer caching)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy application code
COPY agent.py prompt.md ./

# Install the project itself
RUN uv sync --frozen --no-dev

# Download Silero VAD + turn-detector model files
RUN uv run agent.py download-files

# ── Stage 2: Runtime ────────────────────────────────────────────
FROM python:3.12-slim AS runtime

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

RUN groupadd --gid 1000 app && \
    useradd --uid 1000 --gid app --create-home app

WORKDIR /app

# Model cache location must match the builder stage
ENV HF_HOME=/app/.cache/huggingface

# Copy virtual environment, app files, and model cache from builder
COPY --from=builder --chown=app:app /app /app

USER app

# LiveKit agents default port
EXPOSE 8081

ENTRYPOINT ["uv", "run", "agent.py"]
CMD ["start"]
