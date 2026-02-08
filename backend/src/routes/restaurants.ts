import { Router } from 'express';
import {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  getAvailability,
  getMyRestaurants,
} from '../controllers/restaurantController';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', getRestaurants);
router.get('/:id', optionalAuth, getRestaurantById);
router.get('/:id/availability', getAvailability);

// Protected routes - Restaurant owners
router.post(
  '/',
  authenticateToken,
  requireRole(UserRole.RESTAURANT_OWNER, UserRole.ADMIN),
  createRestaurant
);

router.get(
  '/my/restaurants',
  authenticateToken,
  requireRole(UserRole.RESTAURANT_OWNER, UserRole.ADMIN),
  getMyRestaurants
);

router.put(
  '/:id',
  authenticateToken,
  requireRole(UserRole.RESTAURANT_OWNER, UserRole.ADMIN),
  updateRestaurant
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole(UserRole.RESTAURANT_OWNER, UserRole.ADMIN),
  deleteRestaurant
);

export default router;
