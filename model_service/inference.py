import os

# Suppress TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import sys
import json
import re
import nltk
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.text import tokenizer_from_json
from tensorflow.keras.preprocessing.sequence import pad_sequences
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Ensure NLTK data is available
for corpus in ['stopwords', 'wordnet', 'omw-1.4']:
    try:
        nltk.data.find(f'corpora/{corpus}')
    except LookupError:
        nltk.download(corpus, quiet=True)

stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

# Configuration (Must match training config)
MAX_SEQUENCE_LENGTH = 100
TOKEN_PATTERN = re.compile(r"[^a-zA-Z0-9\s]")

def clean_text(text: str) -> str:
    text = text.lower()
    text = TOKEN_PATTERN.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    return " ".join(tokens)

def load_artifacts():
    try:
        base_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models', 'artifacts')
        
        # Load Model
        model_path = os.path.join(base_path, 'bilstm_model.keras')
        model = tf.keras.models.load_model(model_path)
        
        # Load Tokenizer
        tokenizer_path = os.path.join(base_path, 'tokenizer.json')
        with open(tokenizer_path, 'r', encoding='utf-8') as f:
            tokenizer_json = f.read()
            tokenizer = tokenizer_from_json(tokenizer_json)
            
        # Load Label Encoder
        label_encoder_path = os.path.join(base_path, 'label_encoder.json')
        with open(label_encoder_path, 'r', encoding='utf-8') as f:
            label_encoder_data = json.load(f)
            classes = label_encoder_data['classes']
            
        return model, tokenizer, classes
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

def main():
    # Read input from stdin
    try:
        input_text = sys.stdin.read().strip()
        if not input_text:
            return

        model, tokenizer, classes = load_artifacts()
        
        # Preprocess
        cleaned_text = clean_text(input_text)
        sequences = tokenizer.texts_to_sequences([cleaned_text])
        padded = pad_sequences(sequences, maxlen=MAX_SEQUENCE_LENGTH, padding='post', truncating='post')
        
        # Predict
        prediction = model.predict(padded, verbose=0)
        class_idx = int(np.argmax(prediction[0]))
        confidence = float(np.max(prediction[0]))
        raw_label = classes[class_idx]

        # Map to report-aligned classification
        # Class 0: No Risk/Neutral
        # Class 1: Potential Risk (Low/Moderate) - hopelessness, vague ideation
        # Class 2: High Risk (Urgent) - explicit self-harm, active ideation
        label_map = {
            'no_risk':   {'label': 'No Risk',            'classId': 0, 'scoreRange': (0,  25)},
            'low_risk':  {'label': 'Potential Risk',     'classId': 1, 'scoreRange': (26, 69)},
            'high_risk': {'label': 'High Risk — Urgent', 'classId': 2, 'scoreRange': (70, 100)},
        }

        meta = label_map.get(raw_label, label_map['no_risk'])
        lo, hi = meta['scoreRange']
        risk_score = round(lo + confidence * (hi - lo))

        # Probability distribution across all classes
        probs = {classes[i]: round(float(prediction[0][i]), 4) for i in range(len(classes))}

        result = {
            "riskScore":   risk_score,
            "label":       meta['label'],
            "classId":     meta['classId'],
            "confidence":  round(confidence, 4),
            "probabilities": probs,
        }

        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()