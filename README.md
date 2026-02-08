# OpenTable Clone - Restaurant Booking Platform

A complete restaurant reservation system with user accounts, restaurant management, and real-time booking.

## Architecture

```
├── backend/          # Node.js/Express API
├── frontend/         # React SPA
├── database/         # Schema and migrations
└── docker-compose.yml
```

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Frontend:** React, TypeScript, TailwindCSS
- **Auth:** JWT tokens
- **Containerization:** Docker + Docker Compose

## Features

- [ ] User registration/login (customers & restaurant owners)
- [ ] Restaurant profiles with photos, menus, hours
- [ ] Real-time table availability
- [ ] Booking management (create, modify, cancel)
- [ ] Admin dashboard for restaurant owners
- [ ] Search & filter restaurants
- [ ] Email confirmations

## Project Structure

```
opentable-clone/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   ├── prisma/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Quick Start

```bash
# Start all services
docker-compose up -d

# Run migrations
npm run migrate

# Seed data
npm run seed
```
