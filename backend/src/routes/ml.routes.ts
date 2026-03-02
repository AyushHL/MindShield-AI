import { Router } from 'express';
import { predictRisk } from '../controllers/ml.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.post('/predict', authenticateToken, upload.single('file'), predictRisk);

export default router;