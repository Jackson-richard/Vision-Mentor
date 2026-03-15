FROM python:3.11-slim

WORKDIR /app

# Install dependencies needed perfectly for async python/web components
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all the content inside backend to root app context
COPY backend/ .

# Expose port (Cloud Run sets PORT automatically, locally it relies on $PORT which FastAPI respects when run dynamically)
ENV PORT="8000"

EXPOSE 8000

# Start command wrapper to start uvicorn inside the container.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
