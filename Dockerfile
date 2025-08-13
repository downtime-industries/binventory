FROM node:18-alpine AS frontend-builder

# Set working directory for frontend build
WORKDIR /app/frontend

# Copy frontend source files
COPY frontend/package.json ./
COPY frontend/package-lock.json* ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Backend build stage
FROM python:3.11-slim

WORKDIR /app

# Copy Python requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy compiled frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist /app/static

# Set environment variables
ENV PYTHONPATH=/app
ENV STATIC_FILES_DIR=/app/static

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
