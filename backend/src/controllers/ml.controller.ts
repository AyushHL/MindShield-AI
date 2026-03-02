import { Request, Response, NextFunction } from 'express';
import { runInference } from '../utils/pythonRunner';
import { parseFile } from '../utils/fileParser';

export const predictRisk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let textToAnalyze = req.body.text;

    if (req.file) {
      textToAnalyze = await parseFile(req.file.buffer, req.file.mimetype);
    }

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({ message: 'Valid text input or file content is required' });
    }

    const prediction = await runInference(textToAnalyze);
    res.json(prediction);
  } catch (error) {
    next(error);
  }
};