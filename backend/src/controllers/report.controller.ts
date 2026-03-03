import { Request, Response, NextFunction } from 'express';
import Report from '../models/Report';

interface AuthRequest extends Request {
  user?: any;
}

// GET /api/reports  — list paginated reports for the logged-in user
export const listReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (req.query.classId !== undefined && req.query.classId !== '') {
      filter.classId = parseInt(req.query.classId as string);
    }
    if (req.query.search) {
      filter.textSnippet = { $regex: req.query.search, $options: 'i' };
    }

    const [total, reports] = await Promise.all([
      Report.countDocuments(filter),
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-fullText'),
    ]);

    res.json({
      reports,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/stats — summary counts for the logged-in user
export const getReportStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const [total, highRisk, potentialRisk, noRisk] = await Promise.all([
      Report.countDocuments({ userId }),
      Report.countDocuments({ userId, classId: 2 }),
      Report.countDocuments({ userId, classId: 1 }),
      Report.countDocuments({ userId, classId: 0 }),
    ]);
    res.json({ total, highRisk, potentialRisk, noRisk });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/:id — get a single report (with full text)
export const getReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reports/:id
export const deleteReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const report = await Report.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reports — delete all reports for the user
export const deleteAllReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await Report.deleteMany({ userId: req.user.userId });
    res.json({ message: 'All reports deleted' });
  } catch (error) {
    next(error);
  }
};
