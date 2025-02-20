// src/services/analyticsService.ts

import prisma from "../config/database";
import { BookingAnalytics, BookingStatus } from "@prisma/client";
import { cacheService } from "./cacheService";
import { getDateRange } from "@/config/timeframe";
import { Timeframe } from "@/types/index";

export class AnalyticsService {
  /**
   * Compute and store booking analytics for a specific hotel and timeframe.
   * @param hotelId - The ID of the hotel.
   * @param timeframe - The selected timeframe.
   */
  async computeBookingAnalytics(
    hotelId: string,
    timeframe: Timeframe
  ): Promise<void> {
    const { startDate, endDate } = getDateRange(timeframe);

    const totalBookings = await prisma.booking.count({
      where: {
        hotelId,
        bookingTime: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const confirmedBookings = await prisma.booking.count({
      where: {
        hotelId,
        status: BookingStatus.CONFIRMED,
        bookingTime: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        hotelId,
        bookingTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        payment: true,
      },
    });

    const totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (booking.payment?.paidAmount || 0);
    }, 0);

    const averageRevenue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: { _count: { select: { rooms: true } } },
    });

    const totalRooms = hotel?._count.rooms || 0;
    const occupancyRate =
      totalRooms > 0 ? (confirmedBookings / totalRooms) * 100 : 0;

    await prisma.bookingAnalytics.upsert({
      where: {
        hotelId_date_timeframe: {
          hotelId,
          date: startDate,
          timeframe,
        },
      },
      update: {
        totalBookings,
        confirmedBookings,
        totalRevenue,
        averageRevenue,
        occupancyRate,
      },
      create: {
        hotelId,
        date: startDate,
        timeframe,
        totalBookings,
        confirmedBookings,
        totalRevenue,
        averageRevenue,
        occupancyRate,
      },
    });
  }

  /**
   * Retrieve booking analytics for a specific hotel and timeframe, utilizing caching.
   * @param hotelId - The ID of the hotel.
   * @param timeframe - The selected timeframe.
   * @returns An object containing the analytics data and calculation time.
   */
  async getBookingAnalyticsWithCaching(
    hotelId: string,
    timeframe: Timeframe
  ): Promise<{
    revenue: number;
    totalBookings: number;
    pendingBookings: number;
    occupancyRate: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    availableRooms: number;
    calculatedAt: string;
  }> {
    const cacheKey = `analytics_${hotelId}_${timeframe}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log("Returning cached analytics data");
      return JSON.parse(cached);
    }

    const { startDate, endDate } = getDateRange(timeframe);

    // Compute analytics data
    const data = await this.calculateAnalyticsData(hotelId, startDate, endDate);

    console.log("data", data);

    const result = {
      ...data,
      calculatedAt: new Date().toISOString(),
    };

    // Cache the result for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  /**
   * Calculate analytics data without caching.
   * @param hotelId - The ID of the hotel.
   * @param startDate - Start date of the timeframe.
   * @param endDate - End date of the timeframe.
   * @returns An object containing the analytics data.
   */
  private async calculateAnalyticsData(
    hotelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    revenue: number;
    totalBookings: number;
    pendingBookings: number;
    occupancyRate: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    availableRooms: number;
  }> {
    const totalBookings = await prisma.booking.count({
      where: {
        hotelId,
        bookingTime: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        hotelId,
        bookingTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        payment: true,
      },
    });

    const revenue = bookings.reduce((sum, booking) => {
      return sum + (booking.payment?.paidAmount || 0);
    }, 0);

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: { _count: { select: { rooms: true } } },
    });

    const totalRooms = hotel?._count.rooms || 0;
    
    const bookingStats = await prisma.booking.groupBy({
      by: ["status"],
      where: {
        hotelId,
        checkIn: {
          lte: endDate,
        },
        checkOut: {
          gte: startDate,
        },
      },
      _count: {
        _all: true,
      },
    });

    console.log("bookingStats", bookingStats);

    const bookingCounts = bookingStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<BookingStatus, number>);

    console.log("bookingCounts", bookingCounts);

    const occupancyRate =
      totalRooms > 0
        ? (bookingCounts[BookingStatus.CONFIRMED] / totalRooms) * 100
        : 0;

    // Calculate available rooms
    const availableRooms =
      totalRooms -
      (await this.getBookedRoomsCount(hotelId, startDate, endDate));

    return {
      revenue,
      totalBookings,
      pendingBookings: bookingCounts[BookingStatus.PENDING] || 0,
      occupancyRate,
      confirmedBookings: bookingCounts[BookingStatus.CONFIRMED] || 0,
      completedBookings: bookingCounts[BookingStatus.COMPLETED] || 0,
      cancelledBookings: bookingCounts[BookingStatus.CANCELLED] || 0,
      availableRooms,
    };
  }

  /**
   * Get the count of booked rooms within a date range.
   * @param hotelId - The ID of the hotel.
   * @param startDate - Start date of the range.
   * @param endDate - End date of the range.
   * @returns The number of booked rooms.
   */
  private async getBookedRoomsCount(
    hotelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const bookings = await prisma.booking.findMany({
      where: {
        hotelId,
        status: BookingStatus.CONFIRMED,
        OR: [
          {
            checkIn: {
              lte: endDate,
            },
            checkOut: {
              gte: startDate,
            },
          },
        ],
      },
      select: {
        roomId: true,
      },
    });

    const uniqueRoomIds = new Set(bookings.map((booking) => booking.roomId));
    return uniqueRoomIds.size;
  }

  /**
   * Retrieve occupancy data for a specific hotel and timeframe.
   * @param hotelId - The ID of the hotel.
   * @param startDate - Start date of the timeframe.
   * @param endDate - End date of the timeframe.
   * @returns An object containing occupancy data.
   */
  async calculateOccupancyData(
    hotelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalRooms: number;
    totalAvailableRooms: number;
    totalBookedRooms: number;
    pendingBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    completedBookings: number;
    occupancyRate: number;
  }> {
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        rooms: {
          include: {
            bookings: {
              where: {
                AND: [
                  { checkIn: { lte: endDate } },
                  { checkOut: { gte: startDate } },
                  { status: BookingStatus.CONFIRMED },
                ],
              },
            },
          },
        },
      },
    });

    if (!hotel || !hotel.rooms.length) {
      return {
        totalRooms: 0,
        totalAvailableRooms: 0,
        totalBookedRooms: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        occupancyRate: 0,
      };
    }

    const bookedRooms = hotel.rooms.filter(
      (room) => room.bookings.length > 0
    ).length;

    const totalRooms = hotel.rooms.length;
    const totalBookedRooms = bookedRooms;
    const totalAvailableRooms = totalRooms - totalBookedRooms;
    const occupancyRate =
      totalRooms > 0 ? (totalBookedRooms / totalRooms) * 100 : 0;

    const bookingStats = await prisma.booking.groupBy({
      by: ["status"],
      where: {
        hotelId,
        OR: [
          {
            checkIn: {
              lte: endDate,
            },
            checkOut: {
              gte: startDate,
            },
          },
        ],
      },
      _count: {
        _all: true,
      },
    });

    const bookingCounts = bookingStats.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<BookingStatus, number>);

    return {
      totalRooms,
      totalAvailableRooms,
      totalBookedRooms,
      pendingBookings: bookingCounts[BookingStatus.PENDING] || 0,
      confirmedBookings: bookingCounts[BookingStatus.CONFIRMED] || 0,
      cancelledBookings: bookingCounts[BookingStatus.CANCELLED] || 0,
      completedBookings: bookingCounts[BookingStatus.COMPLETED] || 0,
      occupancyRate,
    };
  }
}
