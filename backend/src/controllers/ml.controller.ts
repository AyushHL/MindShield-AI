import { Request, Response, NextFunction } from 'express';
import { runInference } from '../utils/pythonRunner';
import { parseFile } from '../utils/fileParser';
import Report from '../models/Report';

interface AuthRequest extends Request {
  user?: any;
}

export const predictRisk = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let textToAnalyze = req.body.text;
    const source: 'text' | 'file' = req.file ? 'file' : 'text';

    if (req.file) {
      textToAnalyze = await parseFile(req.file.buffer, req.file.mimetype);
    }

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({ message: 'Valid text input or file content is required' });
    }

    const prediction = await runInference(textToAnalyze);

    // Persist report for authenticated users
    if (req.user?.id || req.user?.userId) {
      const userId = req.user.id || req.user.userId;
      const snippet = textToAnalyze.trim().slice(0, 140);
      await Report.create({
        userId,
        textSnippet: snippet + (textToAnalyze.trim().length > 140 ? '…' : ''),
        fullText: textToAnalyze.trim(),
        label: prediction.label,
        classId: prediction.classId,
        riskScore: prediction.riskScore,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities ?? { no_risk: 0, low_risk: 0, high_risk: 0 },
        source,
      });
    }

    res.json(prediction);
  } catch (error) {
    next(error);
  }
};