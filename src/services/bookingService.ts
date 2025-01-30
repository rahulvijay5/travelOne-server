import prisma from '../config/database';
import { Booking, BookingStatus, Payment, PaymentStatus } from '@prisma/client';

interface CreateBookingData {
  hotelId: string;
  roomId: string;
  customerId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  payment?: {
    totalAmount: number;
    paidAmount: number;
    status?: PaymentStatus;
    transactionId?: string;
  };
}

interface UpdateBookingData {
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  status?: BookingStatus;
}

interface UpdatePaymentData {
  status: PaymentStatus;
  paidAmount?: number;
  transactionId?: string;
}

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

    // Create booking with payment
    return prisma.booking.create({
      data: {
        hotelId: data.hotelId,
        roomId: data.roomId,
        customerId: data.customerId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
        status: BookingStatus.CONFIRMED,
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
}
 