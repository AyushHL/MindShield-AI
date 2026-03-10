FROM python:3.10-slim

WORKDIR /app

# Copy and Install Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Application Source
COPY app.py .
COPY models/ models/

# Download NLTK Data at Build Time
RUN python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('omw-1.4')"

# Hugging Face Spaces always Exposes Port 7860
EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]