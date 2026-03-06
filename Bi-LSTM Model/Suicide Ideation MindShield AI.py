import os
import re
import json
import logging
import nltk
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple

os.system("pip install tensorflow pandas numpy scikit-learn nltk")

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_class_weight
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

for corpus in ['stopwords', 'wordnet', 'omw-1.4']:
    try:
        nltk.data.find(f'corpora/{corpus}')
    except LookupError:
        nltk.download(corpus, quiet=True)

stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

class config:
    MAX_SEQUENCE_LENGTH = 100
    VOCAB_SIZE = 10000
    EMBEDDING_DIM = 200
    LSTM_UNITS = 128
    DROPOUT_RATE = 0.5
    BATCH_SIZE = 64
    EPOCHS = 1000
    VALIDATION_SPLIT = 0.2
    RANDOM_SEED = 42

    RISK_LABELS = {
        0: "no_risk",
        1: "low_risk",
        2: "high_risk",
    }
    LABEL_TO_ID = {v: k for k, v in RISK_LABELS.items()}

    KAGGLE_WORKING_DIR = Path("/kaggle/working/ml/artifacts")
    MODELS_DIR = KAGGLE_WORKING_DIR / "models"
    MODEL_PATH = MODELS_DIR / "bilstm_model.keras"
    TOKENIZER_PATH = MODELS_DIR / "tokenizer.json"
    LABEL_ENCODER_PATH = MODELS_DIR / "label_encoder.json"

@dataclass
class PreparedData:
    X: np.ndarray
    y: np.ndarray
    tokenizer: Tokenizer
    label_encoder: LabelEncoder

TOKEN_PATTERN = re.compile(r"[^a-zA-Z0-9\s]")

def clean_text(text: str) -> str:
    text = text.lower()
    text = TOKEN_PATTERN.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()

    tokens = text.split()
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    return " ".join(tokens)

def load_dataset(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    text_col = "tweet" if "tweet" in df.columns else "text"
    label_col = "category" if "category" in df.columns else "label"

    if text_col not in df.columns or label_col not in df.columns:
        raise ValueError(f"CSV must contain text/tweet and label/category columns. Found: {df.columns}")

    df = df.dropna(subset=[text_col])

    df = df.rename(columns={text_col: "text", label_col: "label"})

    print(f"Loaded {len(df)} rows. Cleaning text...")
    df["text"] = df["text"].astype(str).map(clean_text)

    def normalize_label(value):
        if pd.isna(value): return None
        try:
            numeric = int(value)
            if numeric in config.RISK_LABELS: return config.RISK_LABELS[numeric]
        except (TypeError, ValueError):
            pass
        if isinstance(value, str):
            label = value.strip().lower()
            if label in config.LABEL_TO_ID: return label
        return None

    df["label"] = df["label"].map(normalize_label)
    df = df.dropna(subset=["label"])
    print(f"Remaining valid rows after cleaning: {len(df)}")
    return df

def encode_labels(labels: List[str]) -> Tuple[np.ndarray, LabelEncoder]:
    encoder = LabelEncoder()
    classes = [config.RISK_LABELS[idx] for idx in sorted(config.RISK_LABELS.keys())]
    encoder.classes_ = np.array(classes, dtype=object)
    label_to_id = {label: idx for idx, label in enumerate(encoder.classes_)}
    y = np.array([label_to_id[label] for label in labels], dtype=np.int32)
    return y, encoder

def prepare_data(csv_path: Path) -> PreparedData:
    df = load_dataset(csv_path)

    tokenizer = Tokenizer(num_words=config.VOCAB_SIZE, oov_token="<OOV>")
    tokenizer.fit_on_texts(df["text"].tolist())

    sequences = tokenizer.texts_to_sequences(df["text"].tolist())
    X = pad_sequences(sequences, maxlen=config.MAX_SEQUENCE_LENGTH, padding="post", truncating="post")

    y, label_encoder = encode_labels(df["label"].tolist())
    return PreparedData(X=X, y=y, tokenizer=tokenizer, label_encoder=label_encoder)

def build_model(num_classes: int) -> tf.keras.Model:
    inputs = tf.keras.layers.Input(shape=(config.MAX_SEQUENCE_LENGTH,))
    x = tf.keras.layers.Embedding(
        input_dim=config.VOCAB_SIZE,
        output_dim=config.EMBEDDING_DIM,
        input_length=config.MAX_SEQUENCE_LENGTH,
    )(inputs)
    x = tf.keras.layers.Bidirectional(
        tf.keras.layers.LSTM(config.LSTM_UNITS, return_sequences=False)
    )(x)
    x = tf.keras.layers.Dropout(config.DROPOUT_RATE)(x)
    x = tf.keras.layers.Dense(64, activation="relu")(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model

def train_kaggle_model(csv_path_str: str):
    print(f"--- Preparing Data from: {csv_path_str} ---")
    data_path = Path(csv_path_str)

    np.random.seed(config.RANDOM_SEED)
    tf.random.set_seed(config.RANDOM_SEED)

    prepared = prepare_data(data_path)

    X_train, X_val, y_train, y_val = train_test_split(
        prepared.X,
        prepared.y,
        test_size=config.VALIDATION_SPLIT,
        stratify=prepared.y,
        random_state=config.RANDOM_SEED,
    )

    classes = np.unique(y_train)
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=y_train)
    class_weight_dict = {cls: weight for cls, weight in zip(classes, weights)}
    print(f"Class Weights Applied: {class_weight_dict}")

    model = build_model(num_classes=len(prepared.label_encoder.classes_))
    model.summary()

    print("--- Starting Training ---")
    history = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        batch_size=config.BATCH_SIZE,
        epochs=config.EPOCHS,
        class_weight=class_weight_dict,
        verbose=1,
    )

    print("--- Saving Models and Artifacts ---")
    config.MODELS_DIR.mkdir(parents=True, exist_ok=True)

    model.save(config.MODEL_PATH)

    config.TOKENIZER_PATH.write_text(prepared.tokenizer.to_json(), encoding="utf-8")

    encoder_payload = {"classes": prepared.label_encoder.classes_.tolist()}
    config.LABEL_ENCODER_PATH.write_text(json.dumps(encoder_payload, indent=2), encoding="utf-8")

DATASET_PATH = "/kaggle/input/datasets/ayush120/tweets-dataset/tweets_dataset.csv"

if os.path.exists(DATASET_PATH):
    train_kaggle_model(DATASET_PATH)
else:
    print(f"❌ Error: Dataset not found at {DATASET_PATH}. Please check the path and try again.")
