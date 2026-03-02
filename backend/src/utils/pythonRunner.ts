import axios from 'axios';

interface Prediction {
  riskScore:     number;
  label:         string;
  classId:       number;
  confidence:    number;
  probabilities: Record<string, number>;
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const runInference = async (text: string): Promise<Prediction> => {
  try {
    const response = await axios.post<Prediction>(
      `${ML_SERVICE_URL}/predict`,
      { text },
      { timeout: 30_000 }
    );
    return response.data;
  } catch (err: any) {
    const detail = err.response?.data?.detail || err.message;
    throw new Error(`ML service error: ${detail}`);
  }
};
