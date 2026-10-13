FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY netvista-arq/frontend/package*.json ./
RUN npm ci
COPY netvista-arq/frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY netvista-arq/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY netvista-arq/backend/ ./backend/
COPY --from=frontend /build/dist ./frontend/dist/
ENV PYTHONUNBUFFERED=1
EXPOSE 10000
CMD ["sh", "-c", "exec gunicorn --chdir backend app:app --bind 0.0.0.0:${PORT:-10000} --workers 2 --threads 2 --timeout 120 --access-logfile -"]
