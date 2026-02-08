import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const createBookingSchema = z.object({
  restaurantId: z.string().uuid('Invalid restaurant ID'),
  date: z.string().datetime('Invalid date format'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  partySize: z.number().int().min(1).max(20, 'Party size must be 20 or less'),
  specialRequests: z.string().max(500).optional(),
});

const updateBookingSchema = z.object({
  date: z.string().datetime().optional(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  partySize: z.number().int().min(1).max(20).optional(),
  specialRequests: z.string().max(500).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
});

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const validatedData = createBookingSchema.parse(req.body);

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: validatedData.restaurantId },
      select: {
        totalTables: true,
        capacity: true,
      },
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    // Check availability at the requested time
    const bookingDate = new Date(validatedData.date);
    const existingBookings = await prisma.booking.findMany({
      where: {
        restaurantId: validatedData.restaurantId,
        date: {
          gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
          lt: new Date(bookingDate.setHours(23, 59, 59, 999)),
        },
        time: validatedData.time,
        status: { not: 'CANCELLED' },
      },
    });

    const totalPartySize = existingBookings.reduce((sum, b) => sum + b.partySize, 0);

    if (
      existingBookings.length >= restaurant.totalTables ||
      totalPartySize + validatedData.partySize > restaurant.capacity
    ) {
      res.status(409).json({ 
        error: 'Not enough availability at this time',
        available: false,
      });
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        restaurantId: validatedData.restaurantId,
        date: bookingDate,
        time: validatedData.time,
        partySize: validatedData.partySize,
        specialRequests: validatedData.specialRequests,
        status: 'PENDING',
      },
      include: {
        restaurant: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
      return;
    }
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId: req.user.id };
    if (status) {
      where.status = status.toUpperCase();
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              imageUrl: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const getRestaurantBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { restaurantId } = req.params;
    const status = req.query.status as string | undefined;
    const date = req.query.date as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Check ownership
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true },
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    if (restaurant.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized to view these bookings' });
      return;
    }

    const where: any = { restaurantId };
    if (status) {
      where.status = status.toUpperCase();
    }
    if (date) {
      const queryDate = new Date(date);
      where.date = {
        gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        lt: new Date(queryDate.setHours(23, 59, 59, 999)),
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get restaurant bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            imageUrl: true,
            ownerId: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Check authorization
    const isOwner = booking.userId === req.user.id;
    const isRestaurantOwner = booking.restaurant.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isRestaurantOwner && !isAdmin) {
      res.status(403).json({ error: 'Not authorized to view this booking' });
      return;
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

export const updateBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const validatedData = updateBookingSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Only booking owner or admin can modify
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized to modify this booking' });
      return;
    }

    // Cannot modify cancelled or completed bookings
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      res.status(400).json({ 
        error: `Cannot modify ${booking.status.toLowerCase()} booking` 
      });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: validatedData,
      include: {
        restaurant: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      message: 'Booking updated successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
      return;
    }
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const validatedData = updateStatusSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    // Restaurant owner or admin can update status
    const isRestaurantOwner = booking.restaurant.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const isCustomer = booking.userId === req.user.id;

    // Customers can only cancel their own bookings
    if (isCustomer && validatedData.status !== 'CANCELLED') {
      res.status(403).json({ error: 'Customers can only cancel bookings' });
      return;
    }

    if (!isRestaurantOwner && !isAdmin && !isCustomer) {
      res.status(403).json({ error: 'Not authorized to update this booking' });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: validatedData.status },
      include: {
        restaurant: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Booking status updated successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
      return;
    }
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const isOwner = booking.userId === req.user.id;
    const isRestaurantOwner = booking.restaurant.ownerId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isRestaurantOwner && !isAdmin) {
      res.status(403).json({ error: 'Not authorized to cancel this booking' });
      return;
    }

    if (booking.status === 'CANCELLED') {
      res.status(400).json({ error: 'Booking is already cancelled' });
      return;
    }

    if (booking.status === 'COMPLETED') {
      res.status(400).json({ error: 'Cannot cancel completed booking' });
      return;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        restaurant: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};
