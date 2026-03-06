import os

# Suppress TensorFlow logs before importing tf
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import re
import json
import nltk
import numpy as np
import tensorflow as tf

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from tensorflow.keras.preprocessing.text import tokenizer_from_json
from tensorflow.keras.preprocessing.sequence import pad_sequences
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# NLTK data
for corpus in ['stopwords', 'wordnet', 'omw-1.4']:
    try:
        nltk.data.find(f'corpora/{corpus}')
    except LookupError:
        nltk.download(corpus, quiet=True)

# Constants
MAX_SEQUENCE_LENGTH = 100
TOKEN_PATTERN = re.compile(r"[^a-zA-Z0-9\s]")

stop_words  = set(stopwords.words('english'))
lemmatizer  = WordNetLemmatizer()

BASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models', 'artifacts')

# Load artifacts once at startup
print("Loading model artifacts …")

model = tf.keras.models.load_model(os.path.join(BASE_PATH, 'bilstm_model.keras'))

with open(os.path.join(BASE_PATH, 'tokenizer.json'), 'r', encoding='utf-8') as f:
    tokenizer = tokenizer_from_json(f.read())

with open(os.path.join(BASE_PATH, 'label_encoder.json'), 'r', encoding='utf-8') as f:
    classes = json.load(f)['classes']

print(f"Model loaded. Classes: {classes}")

# Label map (report-aligned)
LABEL_MAP = {
    'no_risk':   {'label': 'No Risk',            'classId': 0, 'scoreRange': (0,  25)},
    'low_risk':  {'label': 'Potential Risk',     'classId': 1, 'scoreRange': (26, 69)},
    'high_risk': {'label': 'High Risk — Urgent', 'classId': 2, 'scoreRange': (70, 100)},
}

# FastAPI app
app = FastAPI(title="MindShield ML Service", version="1.0.0")


class PredictRequest(BaseModel):
    text: str


class PredictResponse(BaseModel):
    riskScore:     int
    label:         str
    classId:       int
    confidence:    float
    probabilities: dict


def clean_text(text: str) -> str:
    text = text.lower()
    text = TOKEN_PATTERN.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    tokens = [lemmatizer.lemmatize(w) for w in text.split() if w not in stop_words]
    return " ".join(tokens)


@app.get("/health")
def health():
    return {"status": "ok", "classes": classes}


@app.post("/predict", response_model=PredictResponse)
def predict(body: PredictRequest):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text must not be empty.")

    cleaned  = clean_text(body.text)
    seq      = tokenizer.texts_to_sequences([cleaned])
    padded   = pad_sequences(seq, maxlen=MAX_SEQUENCE_LENGTH, padding='post', truncating='post')

    prediction  = model.predict(padded, verbose=0)
    class_idx   = int(np.argmax(prediction[0]))
    confidence  = float(np.max(prediction[0]))
    raw_label   = classes[class_idx]

    meta       = LABEL_MAP.get(raw_label, LABEL_MAP['no_risk'])
    lo, hi     = meta['scoreRange']
    risk_score = round(lo + confidence * (hi - lo))

    probs = {classes[i]: round(float(prediction[0][i]), 4) for i in range(len(classes))}

    return PredictResponse(
        riskScore=risk_score,
        label=meta['label'],
        classId=meta['classId'],
        confidence=round(confidence, 4),
        probabilities=probs,
    )


# Entry point
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
