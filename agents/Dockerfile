FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Run the unified FastAPI server
# Cloud Run은 포트를 $PORT 환경 변수로 제공합니다.
CMD ["sh", "-c", "uvicorn server:adk_app --host 0.0.0.0 --port $PORT"]
