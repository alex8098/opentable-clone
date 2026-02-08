import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateToken, getMe);outer.put('/me', authenticateToken, updateProfile);

export default router;
