import { Router } from 'express';
import {
  listReports,
  getReportStats,
  getReport,
  deleteReport,
  deleteAllReports,
} from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/stats', getReportStats);
router.get('/', listReports);
router.get('/:id', getReport);
router.delete('/', deleteAllReports);
router.delete('/:id', deleteReport);

export default router;
