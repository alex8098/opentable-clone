import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getRestaurantBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
} from '../controllers/bookingController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Customer routes
router.post('/', authenticateToken, requireRole(UserRole.CUSTOMER, UserRole.ADMIN), createBooking);
router.get('/my-bookings', authenticateToken, getMyBookings);

// Restaurant owner routes
router.get(
  '/restaurant/:restaurantId',
  authenticateToken,
  requireRole(UserRole.RESTAURANT_OWNER, UserRole.ADMIN),
  getRestaurantBookings
);

// Shared routes
router.get('/:id', authenticateToken, getBookingById);
router.put('/:id', authenticateToken, updateBooking);
router.patch('/:id/status', authenticateToken, updateBookingStatus);
router.post('/:id/cancel', authenticateToken, cancelBooking);

export default router;
