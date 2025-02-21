import prisma from "../config/database";
import {
  Booking,
  BookingStatus,
  Payment,
  PaymentStatus,
  RoomStatus,
} from "@prisma/client";
import {
  BookingFilters,
  BookingNotificationType,
  BookingCreatedBy,
  CreateBookingData,
  FilteredBookingResponse,
  UpdateBookingData,
  UpdatePaymentData,
  CheckBookingStatusResponse,
} from "@/types";
import NotificationService from "./notificationService";
import { getCancellationQueue } from "@/queues/PendingBookingQueue";

const notificationService = new NotificationService();

export class BookingService {
  async createBooking(data: CreateBookingData): Promise<Booking> {
    console.log('🏁 Starting booking creation process...');
    
    // Check if room is available for the given dates
    console.log(`🔍 Checking room ${data.roomId} availability for dates:`, {
      checkIn: data.checkIn,
      checkOut: data.checkOut
    });
    
    const existingBooking = await prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: BookingStatus.CONFIRMED,
        OR: [
          {
            AND: [
              { checkIn: { lte: data.checkIn } },
              { checkOut: { gte: data.checkIn } },
            ],
          },
          {
            AND: [
              { checkIn: { lte: data.checkOut } },
              { checkOut: { gte: data.checkOut } },
            ],
          },
        ],
      },
    });

    if (existingBooking) {
      console.log('❌ Room is already booked for the selected dates');
      throw new Error("Room is not available for the selected dates");
    }

    console.log('✅ Room is available for the selected dates');

    console.log('🏨 Updating room status to BOOKED');
    await prisma.room.update({
      where: { id: data.roomId },
      data: { roomStatus: RoomStatus.BOOKED },
    });

    // Create booking with payment
    console.log('📝 Creating booking record with payment information');
    const booking = await prisma.booking.create({
      data: {
        hotelId: data.hotelId,
        roomId: data.roomId,
        customerId: data.customerId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
        status: data.status || BookingStatus.PENDING,
        payment: data.payment
          ? {
              create: {
                ...data.payment,
                status: data.payment.status || PaymentStatus.PENDING,
              },
            }
          : undefined,
      },
      include: {
        hotel: {
          include: {
            managers: true,
          },
        },
        room: true,
        customer: true,
        payment: true,
      },
    });

    console.log(`✅ Booking created successfully with ID: ${booking.id}`);

    const hotel = booking.hotel;
    const managerIds: string[] = hotel.managers.map((manager) => manager.id);

    console.log(`📱 Found ${managerIds.length} managers to notify`);

    if (data.createdBy === BookingCreatedBy.CUSTOMER) {
      console.log('👤 Booking created by customer, sending notifications and scheduling auto-cancellation');
      
      console.log('📤 Sending booking notification to managers');
      notificationService.sendBookingNotification(
        booking.id,
        booking.hotelId,
        BookingNotificationType.CREATED
      );

      console.log('⏰ Scheduling auto-cancellation job');
        await getCancellationQueue().add(
        'cancelBooking',
        { bookingId: booking.id },
        { 
          delay: 15 * 60 * 1000, // 4 minutes for testing, change to 15 minutes in production
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        }
      );
      console.log(`✅ Auto-cancellation scheduled for booking ID: ${booking.id} at ${new Date().toLocaleString()}`);
    } else {
      console.log('👥 Booking created by manager, skipping notifications and auto-cancellation');
    }

    console.log('🏁 Booking creation process completed successfully');
    return booking;
  }

  async getBookingById(bookingId: string): Promise<Booking | null> {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hotel: true,
        room: true,
        customer: true,
        payment: true,
      },
    });
  }

  async checkStatusOfBooking(bookingId: string): Promise<CheckBookingStatusResponse | null> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        checkIn: true,
        checkOut: true,
        guests: true,
        payment: {
          select: {
            paidAmount: true,
            totalAmount: true,
            status: true,
          },
        },
        room: {
          select: {
            roomNumber: true,
            type: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    return booking
  }

  async updateBooking(
    bookingId: string,
    updateData: UpdateBookingData
  ): Promise<Booking> {
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        hotel: true,
        room: true,
        customer: true,
        payment: true,
      },
      });

      if (updateData.status === BookingStatus.CANCELLED) {
        // Update payment status to FAILED if payment exists
        if (updatedBooking.payment) {
          await prisma.payment.update({
            where: { id: updatedBooking.payment.id },
            data: { status: PaymentStatus.FAILED, paidAmount: 0 }, 
          });
        }
      }

        if (
          updateData.status === BookingStatus.CONFIRMED ||
          updateData.status === BookingStatus.CANCELLED
        ) {
          // Find and remove the job from the queue
          const jobs = await getCancellationQueue().getJobs(['delayed']);
          for (const job of jobs) {
            if (job.data.bookingId === bookingId) {
              await job.remove();
              console.log(`Removed cancellation job for booking ID: ${bookingId}`);
            }
          }
        }

    return updatedBooking;
  }

  async makeCheckout(bookingId: string): Promise<Booking> {
    // First get the current booking status
    const currentBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: true,
        payment: true,
      },
    });

    if (!currentBooking) {
      throw new Error("Booking not found");
    }

    if (currentBooking.status !== BookingStatus.CONFIRMED) {
      throw new Error("Only confirmed bookings can be checked out");
    }

    // Use a transaction to ensure both booking and room status are updated
    return prisma.$transaction(async (tx) => {
      // Update booking status to COMPLETED
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.COMPLETED,
        },
        // include: {
        //   hotel: true,
        //   room: true,
        //   customer: true,
        //   payment: true
        // }
      });

      // Update room status to AVAILABLE
      await tx.room.update({
        where: { id: currentBooking.roomId },
        data: { roomStatus: RoomStatus.AVAILABLE },
      });

      return updatedBooking;
    });
  }

  async cancelBooking(bookingId: string): Promise<Booking | null> {
    const booking = await this.updateBooking(bookingId, { status: BookingStatus.CANCELLED });

    if (booking) {
      // Update room status to AVAILABLE
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { roomStatus: RoomStatus.AVAILABLE },
      });

        // Update payment status to FAILED if payment exists
        // if (booking.payment) {
        //   await prisma.payment.update({
        //     where: { id: booking.payment.id },
        //     data: { status: PaymentStatus.FAILED },
        //   });
        // }

      // Send cancellation notification
      notificationService.sendBookingCancelNotification(bookingId);
    }

    return booking;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: {
        customerId: userId,
      },
      include: {
        hotel: true,
        room: true,
        payment: true,
      },
      orderBy: {
        checkIn: "desc",
      },
    });
  }

  async getCurrentBooking(userId: string) {
    const booking = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        bookings: {
          where: {
            AND: [
              {
                checkOut: {
                  gte: new Date(),
                },
                checkIn: {
                  lte: new Date(),
                },
                status: BookingStatus.CONFIRMED,
              },
            ],
          },
        },
      },
    });
    console.log("booking", booking);
    if (!booking?.bookings[0]) {
      return null;
    }
    return booking?.bookings[0];
  }

  async getHotelBookings(hotelId: string): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: {
        hotelId,
      },
      include: {
        room: true,
        customer: true,
        payment: true,
      },
      orderBy: {
        checkIn: "desc",
      },
    });
  }

  async getHotelBookingsByStatus(
    hotelId: string,
    status: BookingStatus
  ): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: {
        hotelId,
        status,
      },
      include: {
        room: true,
        customer: true,
        payment: true,
      },
      orderBy: {
        checkIn: "desc",
      },
    });
  }

  async updatePaymentStatus(
    bookingId: string,
    data: UpdatePaymentData
  ): Promise<Payment> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking?.payment) {
      throw new Error("No payment found for this booking");
    }

    return prisma.payment.update({
      where: { id: booking.payment.id },
      data,
    });
  }

  async getFilteredHotelBookings(
    hotelId: string,
    filters: BookingFilters
  ): Promise<FilteredBookingResponse> {
    const {
      status,
      timeRange,
      startDate,
      endDate,
      roomStatus,
      sortBy = "bookingTime",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = filters;

    // Calculate date ranges based on timeRange
    let dateFilter: any = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeRange) {
      case "today":
        dateFilter = {
          checkIn: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        };
        break;
      case "yesterday":
        dateFilter = {
          checkIn: {
            gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
            lt: today,
          },
        };
        break;
      case "thisWeek":
        const startOfWeek = new Date(
          today.getTime() - today.getDay() * 24 * 60 * 60 * 1000
        );
        dateFilter = {
          OR: [
            {
              checkIn: {
                gte: startOfWeek,
                lt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
              },
            },
            {
              checkOut: {
                gte: startOfWeek,
                lt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
              },
            },
          ],
        };
        break;
      case "thisMonth":
        dateFilter = {
          checkIn: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        };
        break;
      case "custom":
        if (startDate && endDate) {
          dateFilter = {
            OR: [
              {
                checkIn: {
                  gte: startDate,
                  lt: new Date(endDate.getTime() + 24 * 60 * 60 * 1000),
                },
              },
              {
                checkOut: {
                  gte: startDate,
                  lt: new Date(endDate.getTime() + 24 * 60 * 60 * 1000),
                },
              },
            ],
          };
        }
        break;
    }

    // Build where clause
    const where: any = {
      hotelId,
      ...(status && { status }),
      ...(roomStatus && { room: { roomStatus } }),
      ...dateFilter,
    };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort order
    const orderBy: any = {
      [sortBy]: sortOrder,
    };

    // Execute count query and data query in parallel for better performance
    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              type: true,
              roomStatus: true,
              price: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              paidAmount: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data: bookings,
      pagination: {
        total,
        pages,
        currentPage: page,
        limit,
      },
    };
  }
}
