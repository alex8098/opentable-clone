# OpenTable Clone - Backend API

A complete REST API for a restaurant booking platform built with Express, TypeScript, and Prisma.

## Features

- **Authentication**: JWT-based auth with role support (Customer, Restaurant Owner, Admin)
- **Restaurants**: Full CRUD with search, filtering, and availability checking
- **Bookings**: Create, modify, cancel, and manage reservations
- **Validation**: Zod schema validation for all inputs
- **Type Safety**: Full TypeScript support

## Project Structure

```
src/
├── config/
│   └── database.ts       # Prisma client singleton
├── middleware/
│   └── auth.ts           # JWT authentication & role checking
├── controllers/
│   ├── authController.ts # Login, register, profile
│   ├── restaurantController.ts
│   └── bookingController.ts
├── routes/
│   ├── auth.ts
│   ├── restaurants.ts
│   └── bookings.ts
└── index.ts              # Express app entry point
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile

### Restaurants
- `GET /api/restaurants` - List/search restaurants
- `GET /api/restaurants/:id` - Get restaurant details
- `POST /api/restaurants` - Create restaurant (owner/admin)
- `PUT /api/restaurants/:id` - Update restaurant (owner/admin)
- `DELETE /api/restaurants/:id` - Delete restaurant (owner/admin)
- `GET /api/restaurants/:id/availability` - Check availability

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/restaurant/:id` - Get restaurant's bookings (owner)
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `PATCH /api/bookings/:id/status` - Update booking status
- `POST /api/bookings/:id/cancel` - Cancel booking
