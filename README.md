# MindShield AI — Mental Health Crisis & Suicidal Ideation Detection Platform

> AI-powered early-warning platform using a Bi-LSTM neural network for three-tier risk classification.

🌐 **Live**: [https://mindshield-ai.netlify.app/](https://mindshield-ai.netlify.app/)

---

## Architecture

| Service | Stack | Local Port | Deployed On |
|---|---|---|---|
| **ML Service** | Python · FastAPI · TensorFlow | `8000` | Hugging Face Spaces |
| **Backend API** | Node.js · Express · TypeScript | `5001` | Azure Web App |
| **Frontend** | React · Vite · TypeScript · Tailwind CSS v4 | `5173` | Netlify |
| **Database** | MongoDB-compatible API | — | Azure Cosmos DB |

---

## Prerequisites

Make sure the following are installed before starting:

- **Node.js** v18 or higher — https://nodejs.org
- **Python** 3.9 or higher — https://python.org
- **MongoDB** running locally on default port `27017` — https://www.mongodb.com/try/download/community
- **pip** (comes with Python)

---

## Environment Variables

### Backend (`backend/.env`)

Create a `backend/.env` file with the following variables:

```env
# Server
PORT=5001

# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/ai_mind_shield

# JSON Web Token secret (use a strong random string)
JWT_SECRET=your_jwt_secret_here

# ML service URL
ML_SERVICE_URL=http://localhost:8000

# Gmail account used for sending emails (e.g. OTP, alerts)
EMAIL_USER=your_email@gmail.com

# Gmail App Password (not your regular password — generate one in Google Account settings)
EMAIL_PASS=your_gmail_app_password

# Google OAuth Client ID (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

> **Note:** For `EMAIL_PASS`, generate a [Gmail App Password](https://myaccount.google.com/apppasswords) — do **not** use your regular Gmail password.  
> For `GOOGLE_CLIENT_ID`, create credentials in the [Google Cloud Console](https://console.cloud.google.com/).

---

## One-Time Setup

### 1. ML Service dependencies

```bash
cd model_service
pip install -r requirements.txt
```

Model Link (Kaggle): https://www.kaggle.com/code/ayush120/suicide-ideation-project

Required model files (must already be present in `model_service/`):
- `bilstm_model.keras`
- `tokenizer.json`
- `label_encoder.json`

### 2. Backend dependencies

```bash
cd backend
npm install
```

### 3. Frontend dependencies

```bash
cd frontend
npm install
```

---

## Starting the App

Open **three separate terminals** and run each service in order:

### Terminal 1 — ML Service
```bash
cd model_service
python app.py
```
Wait until you see:
```
Model loaded. Classes: ['no_risk', 'low_risk', 'high_risk']
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 — Backend
```bash
cd backend
npm run dev
```
Wait until you see:
```
Server running on port 5001
Connected to MongoDB
```

### Terminal 3 — Frontend
```bash
cd frontend
npm run dev
```
Then open **http://localhost:5173** in your browser.

---

## Stopping Services

If a port is already in use, free it with:

```powershell
# Free port 8000 (ML service)
(Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Free port 5001 (backend)
(Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue).OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

---

## Risk Classification

The platform classifies text into three tiers aligned with the project report:

| Class | Label | Score Range | Meaning |
|---|---|---|---|
| 0 | **No Risk** | 0 – 25 | No crisis indicators detected |
| 1 | **Potential Risk** | 26 – 69 | Concerning language, warrants monitoring |
| 2 | **High Risk — Urgent** | 70 – 100 | Immediate intervention required |

---

## Project Structure

```
├── frontend/          # React + Vite + TypeScript + Tailwind CSS v4
├── backend/           # Node.js + Express + TypeScript REST API
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── models/
│       ├── middleware/
│       └── utils/
└── model_service/     # Python FastAPI ML service
    ├── app.py         # FastAPI server (run this)
    ├── inference.py   # Legacy stdin/stdout script (kept for reference)
    ├── bilstm_model.keras
    ├── tokenizer.json
    └── label_encoder.json
```

---

## API Endpoints

### ML Service (`localhost:8000`)
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check + loaded classes |
| POST | `/predict` | `{ text: string }` → risk classification |

### Backend (`localhost:5001`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/ml/predict` | Authenticated text prediction |
| POST | `/api/ml/predict-file` | Authenticated file upload prediction |
