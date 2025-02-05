import prisma from '../config/database';
import { Booking, BookingStatus, Payment, PaymentStatus, RoomStatus } from '@prisma/client';
import { CreateBookingData, UpdateBookingData, UpdatePaymentData } from '@/types';

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
}
 