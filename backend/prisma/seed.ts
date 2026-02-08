import { PrismaClient, UserRole, BookingStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Clean existing data
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.table.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Cleaned existing data\n')

  // Create 3 restaurant owners
  const ownerPassword = await hash('owner123', 10)
  const owners = await Promise.all([
    prisma.user.create({
      data: {
        email: 'owner1@example.com',
        passwordHash: ownerPassword,
        firstName: 'Marco',
        lastName: 'Rossi',
        phone: '+1-555-0101',
        role: UserRole.OWNER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'owner2@example.com',
        passwordHash: ownerPassword,
        firstName: 'Sarah',
        lastName: 'Chen',
        phone: '+1-555-0102',
        role: UserRole.OWNER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'owner3@example.com',
        passwordHash: ownerPassword,
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+1-555-0103',
        role: UserRole.OWNER,
      },
    }),
  ])
  console.log(`✅ Created ${owners.length} restaurant owners`)

  // Create sample customers
  const customerPassword = await hash('customer123', 10)
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'customer1@example.com',
        passwordHash: customerPassword,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0201',
        role: UserRole.CUSTOMER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer2@example.com',
        passwordHash: customerPassword,
        firstName: 'Emily',
        lastName: 'Johnson',
        phone: '+1-555-0202',
        role: UserRole.CUSTOMER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer3@example.com',
        passwordHash: customerPassword,
        firstName: 'Michael',
        lastName: 'Williams',
        phone: '+1-555-0203',
        role: UserRole.CUSTOMER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer4@example.com',
        passwordHash: customerPassword,
        firstName: 'Jessica',
        lastName: 'Brown',
        phone: '+1-555-0204',
        role: UserRole.CUSTOMER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer5@example.com',
        passwordHash: customerPassword,
        firstName: 'David',
        lastName: 'Miller',
        phone: '+1-555-0205',
        role: UserRole.CUSTOMER,
      },
    }),
  ])
  console.log(`✅ Created ${customers.length} customers\n`)

  // Create 3 restaurants
  const restaurants = await Promise.all([
    prisma.restaurant.create({
      data: {
        name: "Marco's Trattoria",
        description: 'Authentic Italian cuisine in a cozy, family-friendly atmosphere. Famous for handmade pasta and wood-fired pizzas.',
        address: '123 Main Street',
        city: 'New York',
        phone: '+1-212-555-1001',
        cuisineType: 'Italian',
        priceRange: 3,
        photos: [
          'https://example.com/marco1.jpg',
          'https://example.com/marco2.jpg',
        ],
        openingHours: {
          monday: { open: '11:30', close: '22:00' },
          tuesday: { open: '11:30', close: '22:00' },
          wednesday: { open: '11:30', close: '22:00' },
          thursday: { open: '11:30', close: '22:00' },
          friday: { open: '11:30', close: '23:00' },
          saturday: { open: '11:00', close: '23:00' },
          sunday: { open: '11:00', close: '21:00' },
        },
        ownerId: owners[0].id,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: 'Dragon Palace',
        description: 'Exquisite Chinese dining experience featuring Sichuan and Cantonese specialties. Elegant decor and private dining rooms available.',
        address: '456 Oak Avenue',
        city: 'San Francisco',
        phone: '+1-415-555-1002',
        cuisineType: 'Chinese',
        priceRange: 4,
        photos: [
          'https://example.com/dragon1.jpg',
          'https://example.com/dragon2.jpg',
        ],
        openingHours: {
          monday: { open: '17:00', close: '22:30' },
          tuesday: { open: '17:00', close: '22:30' },
          wednesday: { open: '17:00', close: '22:30' },
          thursday: { open: '17:00', close: '22:30' },
          friday: { open: '17:00', close: '23:00' },
          saturday: { open: '16:00', close: '23:00' },
          sunday: { open: '16:00', close: '22:00' },
        },
        ownerId: owners[1].id,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: "Le Petit Bistro",
        description: 'Classic French bistro serving traditional dishes with a modern twist. Intimate setting perfect for romantic dinners.',
        address: '789 Rue de Paris',
        city: 'Chicago',
        phone: '+1-312-555-1003',
        cuisineType: 'French',
        priceRange: 4,
        photos: [
          'https://example.com/bistro1.jpg',
          'https://example.com/bistro2.jpg',
        ],
        openingHours: {
          monday: { open: '17:30', close: '22:00' },
          tuesday: { open: '17:30', close: '22:00' },
          wednesday: { open: '17:30', close: '22:00' },
          thursday: { open: '17:30', close: '22:00' },
          friday: { open: '17:30', close: '23:00' },
          saturday: { open: '17:00', close: '23:00' },
          sunday: { open: '17:00', close: '22:00' },
        },
        ownerId: owners[2].id,
      },
    }),
  ])
  console.log(`✅ Created ${restaurants.length} restaurants\n`)

  // Create 10 tables per restaurant (30 tables total)
  const tables: any[] = []
  for (const restaurant of restaurants) {
    for (let i = 1; i <= 10; i++) {
      const capacity = i <= 4 ? 2 : i <= 7 ? 4 : i <= 9 ? 6 : 8
      const table = await prisma.table.create({
        data: {
          restaurantId: restaurant.id,
          tableNumber: `T${i.toString().padStart(2, '0')}`,
          capacity,
          isActive: true,
        },
      })
      tables.push(table)
    }
  }
  console.log(`✅ Created ${tables.length} tables (10 per restaurant)\n`)

  // Create 5 sample bookings
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const bookingDate = new Date(tomorrow)
  bookingDate.setDate(bookingDate.getDate() + 2)

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: customers[0].id,
        restaurantId: restaurants[0].id,
        tableId: tables[0].id, // Marco's - Table T01
        date: bookingDate,
        time: '19:00',
        partySize: 2,
        status: BookingStatus.CONFIRMED,
        specialRequests: 'Window seat preferred, celebrating anniversary',
      },
    }),
    prisma.booking.create({
      data: {
        userId: customers[1].id,
        restaurantId: restaurants[0].id,
        tableId: tables[5].id, // Marco's - Table T06
        date: bookingDate,
        time: '20:00',
        partySize: 4,
        status: BookingStatus.PENDING,
        specialRequests: 'High chair needed for toddler',
      },
    }),
    prisma.booking.create({
      data: {
        userId: customers[2].id,
        restaurantId: restaurants[1].id,
        tableId: tables[12].id, // Dragon Palace - Table T03
        date: bookingDate,
        time: '18:30',
        partySize: 6,
        status: BookingStatus.CONFIRMED,
        specialRequests: 'Private dining room if available',
      },
    }),
    prisma.booking.create({
      data: {
        userId: customers[3].id,
        restaurantId: restaurants[2].id,
        tableId: tables[23].id, // Le Petit Bistro - Table T04
        date: bookingDate,
        time: '20:30',
        partySize: 2,
        status: BookingStatus.CONFIRMED,
        specialRequests: 'Romantic table setting, gluten-free options',
      },
    }),
    prisma.booking.create({
      data: {
        userId: customers[4].id,
        restaurantId: restaurants[1].id,
        tableId: tables[19].id, // Dragon Palace - Table T10
        date: bookingDate,
        time: '19:30',
        partySize: 8,
        status: BookingStatus.PENDING,
        specialRequests: 'Birthday celebration, cake service needed',
      },
    }),
  ])
  console.log(`✅ Created ${bookings.length} sample bookings\n`)

  // Create some sample reviews
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        userId: customers[0].id,
        restaurantId: restaurants[0].id,
        rating: 5,
        comment: 'Amazing pasta! The carbonara was the best I\'ve ever had. Will definitely return!',
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[2].id,
        restaurantId: restaurants[1].id,
        rating: 4,
        comment: 'Great Sichuan dishes, very authentic. Service was a bit slow but food was excellent.',
      },
    }),
    prisma.review.create({
      data: {
        userId: customers[3].id,
        restaurantId: restaurants[2].id,
        rating: 5,
        comment: 'Perfect romantic dinner spot. The coq au vin was divine and the wine selection is superb.',
      },
    }),
  ])
  console.log(`✅ Created ${reviews.length} sample reviews\n`)

  console.log('🎉 Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - ${owners.length} restaurant owners`)
  console.log(`   - ${customers.length} customers`)
  console.log(`   - ${restaurants.length} restaurants`)
  console.log(`   - ${tables.length} tables (${tables.length / restaurants.length} per restaurant)`)
  console.log(`   - ${bookings.length} bookings`)
  console.log(`   - ${reviews.length} reviews`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
