import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const createRestaurantSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  cuisine: z.array(z.string()).default([]),
  priceRange: z.number().min(1).max(4).default(2),
  imageUrl: z.string().url().optional(),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  totalTables: z.number().int().positive().default(20),
  capacity: z.number().int().positive().default(80),
});

const updateRestaurantSchema = createRestaurantSchema.partial();

const searchParamsSchema = z.object({
  city: z.string().optional(),
  cuisine: z.string().optional(),
  priceRange: z.string().transform(Number).optional(),
  minRating: z.string().transform(Number).optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
});

export const createRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const validatedData = createRestaurantSchema.parse(req.body);

    const restaurant = await prisma.restaurant.create({
      data: {
        ...validatedData,
        ownerId: req.user.id,
      },
    });

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
      return;
    }
    console.error('Create restaurant error:', error);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
};

export const getRestaurants = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = searchParamsSchema.parse(req.query);
    const { city, cuisine, priceRange, minRating, page, limit, search } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (cuisine) {
      where.cuisine = { has: cuisine };
    }

    if (priceRange) {
      where.priceRange = priceRange;
    }

    if (minRating) {
      where.rating = { gte: minRating };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { cuisine: { has: search } },
      ];
    }

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      }),
      prisma.restaurant.count({ where }),
    ]);

    res.json({
      restaurants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
      return;
    }
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

export const getRestaurantById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    res.json({ restaurant });
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
};

export const updateRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const validatedData = updateRestaurantSchema.parse(req.body);

    // Check ownership
    const existing = await prisma.restaurant.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized to update this restaurant' });
      return;
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      message: 'Restaurant updated successfully',
      restaurant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
      return;
    }
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
};

export const deleteRestaurant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Check ownership
    const existing = await prisma.restaurant.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Not authorized to delete this restaurant' });
      return;
    }

    await prisma.restaurant.delete({
      where: { id },
    });

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
};

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const dateParam = req.query.date as string;

    if (!dateParam) {
      res.status(400).json({ error: 'Date parameter is required' });
      return;
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: {
        openingTime: true,
        closingTime: true,
        totalTables: true,
        capacity: true,
      },
    });

    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' });
      return;
    }

    // Get existing bookings for the date
    const existingBookings = await prisma.booking.findMany({
      where: {
        restaurantId: id,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
        status: { not: 'CANCELLED' },
      },
      select: {
        time: true,
        partySize: true,
      },
    });

    // Generate available time slots (every 30 minutes)
    const slots: string[] = [];
    const [openHour, openMinute] = restaurant.openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = restaurant.closingTime.split(':').map(Number);

    let currentHour = openHour;
    let currentMinute = openMinute;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(
        currentMinute
      ).padStart(2, '0')}`;

      // Count bookings at this time
      const bookingsAtTime = existingBookings.filter((b) => b.time === timeString);
      const totalPartySize = bookingsAtTime.reduce((sum, b) => sum + b.partySize, 0);

      // Consider available if under capacity and table limit
      if (
        bookingsAtTime.length < restaurant.totalTables &&
        totalPartySize < restaurant.capacity
      ) {
        slots.push(timeString);
      }

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    res.json({
      date: dateParam,
      availableSlots: slots,
      totalSlots: slots.length,
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

export const getMyRestaurants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const restaurants = await prisma.restaurant.findMany({
      where: { ownerId: req.user.id },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    res.json({ restaurants });
  } catch (error) {
    console.error('Get my restaurants error:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};
