import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDummyData() {
  // 1. Create Users (owner, manager, and customer)
  const user1 = await prisma.user.create({
    data: {
      clerkId: 'user_2sKyE39pd6O6qSq9GZU8ee5UCLz',
      name: 'Ayush Bhai',
      email: 'abcd+clerk_test@example.com',
      phoneNumber: '9252993111',
      role: 'CUSTOMER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      clerkId: 'manager-001',
      name: 'Pankaj Kumar',
      email: 'pankaj+clerk_test@example.com',
      phoneNumber: '9876543210',
      role: 'MANAGER',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      clerkId: 'customer-001',
      name: 'Alex Johnson',
      email: 'alexjohnson@example.com',
      phoneNumber: '1122334455',
      role: 'CUSTOMER',
    },
  });
  const user4 = await prisma.user.create({
    data: {
      clerkId: 'user_2sB4vFmbn240RemIYal8PkW8Cpz',
      name: 'Aapke Gaane',
      email: 'aapkegaane0@example.com',
      phoneNumber: '9252993222',
      role: 'OWNER',
    },
  });

  // 2. Create a Hotel
  const hotel = await prisma.hotel.create({
    data: {
      hotelName: 'King Palace',
      description: 'Best hotel in the town to experience',
      location: 'maps.google.com/abcd/ijkl',
      address: 'Hindi Village, USA road, 32 inc, India',
      code: 'abcd',
      contactNumber: '9252993222',
      amenities: ['bathtub', 'balcony', 'mountains'],
      hotelImages: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'https://images.unsplash.com/photo-1738000711416-a22d5ad609a8?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
      owner: {
        connect: { id: user4.id }, // Connect the owner to this hotel
      },
      managers: {
        connect: [{ id: user2.id },{ id: user4.id }], // Connect the manager to this hotel
      },
    },
  });

  // 3. Create Hotel Rules
  const hotelRules = await prisma.hotelRules.create({
    data: {
      hotelId: hotel.id,
      petsAllowed: true,
      maxPeopleInOneRoom: 3,
      extraMattressOnAvailability: true,
      parking: true,
      swimmingPool: true,
      swimmingPoolTimings: '9 AM - 6 PM',
      ownRestaurant: true,
      checkInTime: 660,
      checkOutTime: 600,
      guestInfoNeeded: true,
      smokingAllowed: false,
      alcoholAllowed: false,
      eventsAllowed: true,
      minimumAgeForCheckIn: 18,
    },
  });

  // 4. Create Rooms for the Hotel
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        roomNumber: '101',
        type: 'Single',
        price: 1000,
        maxOccupancy: 2,
        hotelId: hotel.id,
        features: ['bathtub', 'balcony'],
        images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aG90ZWwlMjByb29tfGVufDB8fDB8fHww', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aG90ZWwlMjByb29tfGVufDB8fDB8fHww'],
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '102',
        type: 'Double',
        price: 1500,
        maxOccupancy: 4,
        hotelId: hotel.id,
        features: ['bathtub', 'mountains view'],
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8aG90ZWwlMjByb29tfGVufDB8fDB8fHww', 'https://plus.unsplash.com/premium_photo-1670360414903-19e5832f8bc4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8aG90ZWwlMjByb29tfGVufDB8fDB8fHww'],
      },
    }),
    prisma.room.create({
      data: {
        roomNumber: '103',
        type: 'Suite',
        price: 2500,
        maxOccupancy: 4,
        hotelId: hotel.id,
        features: ['jacuzzi', 'balcony', 'mountain view'],
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aG90ZWwlMjByb29tfGVufDB8fDB8fHww', 
       'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8aG90ZWwlMjByb29tfGVufDB8fDB8fHww'],
      },
    }),
  ]);

  // 5. Create Bookings for the Rooms
  const booking1 = await prisma.booking.create({
    data: {
      hotelId: hotel.id,
      roomId: rooms[0].id,
      customerId: user3.id,
      checkIn: new Date(new Date().setHours(11, 0, 0, 0)),
      checkOut: new Date(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).setHours(10, 0, 0, 0)),
      guests: 2,
      status: 'PENDING',
      payment: {
        create: {
          totalAmount: 1000,
          paidAmount: 0,
          status: 'PENDING',
          transactionId: "OFFLINE",
        },
      },
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      hotelId: hotel.id,
      roomId: rooms[1].id,
      customerId: user3.id,
      checkIn: new Date(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).setHours(11, 0, 0, 0)),
      checkOut: new Date(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).setHours(10, 0, 0, 0)),
      guests: 2,
      status: 'PENDING',
      payment: {
        create: {
          totalAmount: 1500,
          paidAmount: 0,
          status: 'PENDING',
          transactionId: "OFFLINE",
        },
      },
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      hotelId: hotel.id,
      roomId: rooms[2].id,
      customerId: user3.id,
      checkIn: new Date(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).setHours(11, 0, 0, 0)),
      checkOut: new Date(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).setHours(10, 0, 0, 0)),
      guests: 2,
      status: 'CANCELLED',
      payment: {
        create: {
          totalAmount: 2500,
          paidAmount: 0,
          status: 'FAILED',
          transactionId: "OFFLINE",
        },
      },
    },
  });

  const feedBack1 = await prisma.hotelFeedback.create({
    data:{
      hotelId:hotel.id,
      userId:user3.id,
      rating:4,
      description:'Beautiful hotel'
    }
  })
  const feedBack2 = await prisma.hotelFeedback.create({
    data:{
      hotelId:hotel.id,
      userId:user3.id,
      rating:2,
    }
  })
  const feedBack3 = await prisma.hotelFeedback.create({
    data:{
      hotelId:hotel.id,
      userId:user3.id,
      rating:5,
      description:'Nice place to stay.'
    }
  })

  console.log('Dummy Data Created Successfully!');
}

createDummyData()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
