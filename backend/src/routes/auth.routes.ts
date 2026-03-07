import { Router } from 'express';
import { register, login, googleLogin, getProfile, updateProfile, changePassword, setPassword, deleteAccount, uploadAvatar, deleteAvatar, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import multer from 'multer';

const router = Router();
const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, changePassword);
router.post('/set-password', authenticateToken, setPassword);
router.delete('/account', authenticateToken, deleteAccount);
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), uploadAvatar);
router.delete('/avatar', authenticateToken, deleteAvatar);

export default router;