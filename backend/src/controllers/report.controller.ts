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

// GET /api/reports/insights — aggregated analytics for the logged-in user
export const getInsights = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;

    const reports = await Report.find({ userId })
      .select('classId riskScore confidence createdAt source')
      .lean();

    // Risk distribution
    const distribution = { no_risk: 0, potential_risk: 0, high_risk: 0 };
    reports.forEach(r => {
      if (r.classId === 0) distribution.no_risk++;
      else if (r.classId === 1) distribution.potential_risk++;
      else distribution.high_risk++;
    });

    // Analyses per day — last 14 days
    const now = new Date();
    const timeline: { date: string; count: number; highRisk: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      timeline.push({ date: d.toISOString().split('T')[0], count: 0, highRisk: 0 });
    }
    reports.forEach(r => {
      const dateStr = new Date(r.createdAt).toISOString().split('T')[0];
      const day = timeline.find(d => d.date === dateStr);
      if (day) { day.count++; if (r.classId === 2) day.highRisk++; }
    });

    // Per-class stats
    const classStats = [0, 1, 2].map(classId => {
      const filtered = reports.filter(r => r.classId === classId);
      const avgConf = filtered.length
        ? filtered.reduce((s, r) => s + r.confidence, 0) / filtered.length : 0;
      const avgRisk = filtered.length
        ? filtered.reduce((s, r) => s + r.riskScore, 0) / filtered.length : 0;
      return {
        classId,
        count: filtered.length,
        avgConfidence: Math.round(avgConf * 1000) / 10,
        avgRiskScore: Math.round(avgRisk),
      };
    });

    // Source breakdown
    const textCount = reports.filter(r => r.source === 'text').length;
    const fileCount = reports.filter(r => r.source === 'file').length;

    res.json({
      total: reports.length,
      distribution,
      timeline,
      classStats,
      sourceBreakdown: { text: textCount, file: fileCount },
    });
  } catch (error) {
    next(error);
  }
};
