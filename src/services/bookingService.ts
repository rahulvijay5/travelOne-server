import prisma from '../config/database';
import { Booking, BookingStatus, Payment, PaymentStatus, RoomStatus } from '@prisma/client';
import { BookingFilters, CreateBookingData, FilteredBookingResponse, UpdateBookingData, UpdatePaymentData } from '@/types';

export class BookingService {
  async createBooking(data: CreateBookingData): Promise<Booking> {
    // Check if room is available for the given dates
    const existingBooking = await prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        status: BookingStatus.CONFIRMED,
        OR: [
          {
            AND: [
              { checkIn: { lte: data.checkIn } },
              { checkOut: { gte: data.checkIn } }
            ]
          },
          {
            AND: [
              { checkIn: { lte: data.checkOut } },
              { checkOut: { gte: data.checkOut } }
            ]
          }
        ]
      }
    });

    if (existingBooking) {
      throw new Error('Room is not available for the selected dates');
    }

    const roomStatus = await prisma.room.update({
      where: { id: data.roomId },
      data: { roomStatus: RoomStatus.BOOKED }
    });

    // Create booking with payment
    return prisma.booking.create({
      data: {
        hotelId: data.hotelId,
        roomId: data.roomId,
        customerId: data.customerId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
        status: data.status || BookingStatus.PENDING,
        payment: data.payment ? {
          create: {
            ...data.payment,
            status: data.payment.status || PaymentStatus.PENDING
          }
        } : undefined
      },
      include: {
        hotel: true,
        room: true,
        customer: true,
        payment: true
      }
    });
  }

  async getBookingById(bookingId: string): Promise<Booking | null> {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hotel: true,
        room: true,
        customer: true,
        payment: true
      }
    });
  }

  async updateBooking(bookingId: string, data: UpdateBookingData): Promise<Booking> {
    return prisma.booking.update({
      where: { id: bookingId },
      data,
      include: {
        hotel: true,
        room: true,
        customer: true,
        payment: true
      }
    });
  }

  async cancelBooking(bookingId: string): Promise<Booking> {
    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED
      },
      include: {
        hotel: true,
        room: true,
        customer: true,
        payment: true
      }
    });
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: {
        customerId: userId
      },
      include: {
        hotel: true,
        room: true,
        payment: true
      },
      orderBy: {
        checkIn: 'desc'
      }
    });
  }

  async getHotelBookings(hotelId: string): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: {
        hotelId
      },
      include: {
        room: true,
        customer: true,
        payment: true
      },
      orderBy: {
        checkIn: 'desc'
      }
    });
  }

  async getHotelBookingsByStatus(hotelId: string, status: BookingStatus): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: {
        hotelId,
        status
      },
      include: {
        room: true,
        customer: true,
        payment: true
      },
      orderBy: {
        checkIn: 'desc'
      }
    });
  }

  async updatePaymentStatus(bookingId: string, data: UpdatePaymentData): Promise<Payment> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true }
    });

    if (!booking?.payment) {
      throw new Error('No payment found for this booking');
    }

    return prisma.payment.update({
      where: { id: booking.payment.id },
      data
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
      sortBy = 'bookingTime',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = filters;

    // Calculate date ranges based on timeRange
    let dateFilter: any = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeRange) {
      case 'today':
        dateFilter = {
          checkIn: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'yesterday':
        dateFilter = {
          checkIn: {
            gte: new Date(today.getTime() - 24 * 60 * 60 * 1000),
            lt: today
          }
        };
        break;
      case 'thisWeek':
        const startOfWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        dateFilter = {
          checkIn: {
            gte: startOfWeek,
            lt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'thisMonth':
        dateFilter = {
          checkIn: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          }
        };
        break;
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            checkIn: {
              gte: startDate,
              lt: new Date(endDate.getTime() + 24 * 60 * 60 * 1000)
            }
          };
        }
        break;
    }

    // Build where clause
    const where: any = {
      hotelId,
      ...(status && { status }),
      ...(roomStatus && { room: { roomStatus } }),
      ...dateFilter
    };

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort order
    const orderBy: any = {
      [sortBy]: sortOrder
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
              price: true
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              paidAmount: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      })
    ]);

    const pages = Math.ceil(total / limit);

    return {
      data: bookings,
      pagination: {
        total,
        pages,
        currentPage: page,
        limit
      }
    };
  }
}
 