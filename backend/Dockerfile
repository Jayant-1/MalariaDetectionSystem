FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application
COPY . .

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Start command - Railway requires $PORT variable
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}
