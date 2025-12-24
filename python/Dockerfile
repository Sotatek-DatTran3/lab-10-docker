# --- Build Stage ---
FROM python:3.11-alpine AS builder

WORKDIR /app

# Only install what's needed to build dependencies
RUN apk add --no-cache gcc musl-dev postgresql-dev libffi-dev

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt


# --- Production Stage ---
FROM python:3.11-alpine

WORKDIR /app

# 1. Install ONLY runtime dependencies (libpq instead of postgresql-dev)
RUN apk add --no-cache libpq

# 2. Create non-root user early
RUN addgroup -g 1001 -S python && adduser -u 1001 -S python -G python

# 3. Copy only the wheels and install
COPY --from=builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && \
    rm -rf /wheels  # Clean up the wheels after install

# 4. Copy code (Make sure you have a .dockerignore file!)
COPY . .

RUN chown -R python:python /app
USER python

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python manage.py check --deploy || exit 1 

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]