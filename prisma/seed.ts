import { PrismaClient, Role, BookingStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample users
  const owner = await prisma.user.create({
    data: {
      clerkId: "user_2NNEqL3CricW9Fz",
      name: "John Doe",
      email: "john.doe@example.com",
      phoneNumber: "+91-9876543210",
      role: Role.OWNER,
    },
  });

  const manager = await prisma.user.create({
    data: {
      clerkId: "user_2MMEqL3CricW9Fy",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phoneNumber: "+91-9876543211",
      role: Role.MANAGER,
    },
  });

  const customer = await prisma.user.create({
    data: {
      clerkId: "user_2KKEqL3CricW9Fx",
      name: "Ankit Sharma",
      email: "ankit.sharma@gmail.com",
      phoneNumber: "8886543210",
      role: Role.CUSTOMER,
    },
  });

  // Create a sample hotel
  const hotel = await prisma.hotel.create({
    data: {
      hotelName: "Sunset Paradise Hotel",
      description: "A luxurious hotel with breathtaking views of the sunset, offering world-class amenities and exceptional hospitality.",
      location: "https://maps.app.goo.gl/san6xjr1mabGLsx59",
      address: "123, Main Road, Jaipur, Rajasthan, India",
      totalRooms: 26,
      code: "a43j",
      contactNumber: "+91-9876543210",
      amenities: [
        "Free WiFi",
        "Gym",
        "Spa",
        "Room Service",
        "Airport Pickup"
      ],
      hotelImages: [
        "https://images.unsplash.com/photo-1517840901100-8179e982acb7?q=80&w=2940&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2940&auto=format&fit=crop"
      ],
      owner: {
        connect: {
          id: owner.id
        }
      },
      managers: {
        connect: {
          id: manager.id
        }
      },
    },
  });

  // Create hotel rules
  const hotelRules = await prisma.hotelRules.create({
    data: {
      hotelId: hotel.id,
      petsAllowed: true,
      maxPeopleInOneRoom: 3,
      extraMattressOnAvailability: true,
      parking: true,
      swimmingPool: true,
      swimmingPoolTimings: "6:00 AM - 8:00 PM",
      ownRestaurant: true,
      checkInTime: "11:00",
      checkOutTime: "10:00",
      guestInfoNeeded: true,
      smokingAllowed: false,
      alcoholAllowed: true,
      eventsAllowed: true,
      minimumAgeForCheckIn: 18,
    },
  });

  // Create sample rooms
  const luxurySuite = await prisma.room.create({
    data: {
      hotelId: hotel.id,
      roomNumber: "101",
      type: "Suite",
      price: 5000,
      maxOccupancy: 3,
      available: true,
      features: ["AC", "TV", "Balcony", "Bathtub"],
      images: [
        "https://images.unsplash.com/photo-1541971875076-8f970d573be6?q=80&w=3174&auto=format&fit=crop"
      ],
    },
  });

  const deluxeRoom = await prisma.room.create({
    data: {
      hotelId: hotel.id,
      roomNumber: "102",
      type: "Double",
      price: 3000,
      maxOccupancy: 2,
      available: false,
      features: ["AC", "TV", "Mini-Fridge"],
      images: [
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=3132&auto=format&fit=crop"
      ],
    },
  });

  // Create a sample booking with payment
  const booking = await prisma.booking.create({
    data: {
      hotelId: hotel.id,
      roomId: deluxeRoom.id,
      customerId: customer.id,
      checkIn: new Date("2024-08-25"),
      checkOut: new Date("2024-08-28"),
      guests: 2,
      status: BookingStatus.CONFIRMED,
      bookingTime: new Date("2024-08-20T15:30:00Z"),
      payment: {
        create: {
          totalAmount: 9000,
          paidAmount: 9000,
          status: PaymentStatus.PAID,
          transactionId: "txn5678",
        },
      },
    },
  });

  console.log({
    owner,
    manager,
    customer,
    hotel,
    hotelRules,
    luxurySuite,
    deluxeRoom,
    booking,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 