// src/services/analyticsService.ts

import prisma from "../config/database";
import { BookingAnalytics, BookingStatus } from "@prisma/client";
import { cacheService } from "./cacheService";

export class AnalyticsService {
  /**
   * Compute and store daily booking analytics for a specific hotel.
   * This method can be scheduled to run daily.
   */
  async computeDailyBookingAnalytics(
    hotelId: string,
    date: Date
  ): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const totalBookings = await prisma.booking.count({
      where: {
        hotelId,
        bookingTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const canceledBookings = await prisma.booking.count({
      where: {
        hotelId,
        status: BookingStatus.CANCELLED,
        bookingTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        hotelId,
        bookingTime: {
          gte: startOfDay,
          lt: endOfDay,
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

    // Assuming total rooms are available in the Hotel model
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: { rooms: true },
    });

    const totalRooms = hotel?.totalRooms || 0;
    const occupancyRate =
      totalRooms > 0 ? (totalBookings / totalRooms) * 100 : 0;

    await prisma.bookingAnalytics.upsert({
      where: {
        hotelId_date: {
          hotelId,
          date: startOfDay,
        },
      },
      update: {
        totalBookings,
        canceledBookings,
        totalRevenue,
        averageRevenue,
        occupancyRate,
      },
      create: {
        hotelId,
        date: startOfDay,
        totalBookings,
        canceledBookings,
        totalRevenue,
        averageRevenue,
        occupancyRate,
      },
    });
  }

  /**
   * Retrieve booking analytics for a specific hotel within a date range.
   */
  async getBookingAnalytics(
    hotelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<BookingAnalytics[]> {
    return prisma.bookingAnalytics.findMany({
      where: {
        hotelId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });
  }

  private async calculateRealTimeBookingAnalytics(
    hotelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    precomputedData: BookingAnalytics[];
    realTimeData: {
      totalBookings: number;
      canceledBookings: number;
      totalRevenue: number;
      averageRevenue: number;
      occupancyRate: number;
    };
  }> {
    const precomputedData = await this.getBookingAnalytics(
      hotelId,
      startDate,
      endDate
    );

    // Example: Calculate bookings in the last hour
    const realTimeStart = new Date();
    realTimeStart.setHours(realTimeStart.getHours() - 1);

    const totalBookings = await prisma.booking.count({
      where: {
        hotelId,
        bookingTime: {
          gte: realTimeStart,
        },
      },
    });

    const canceledBookings = await prisma.booking.count({
      where: {
        hotelId,
        status: BookingStatus.CANCELLED,
        bookingTime: {
          gte: realTimeStart,
        },
      },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        hotelId,
        bookingTime: {
          gte: realTimeStart,
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
      include: { rooms: true },
    });

    const totalRooms = hotel?.totalRooms || 0;
    const occupancyRate =
      totalRooms > 0 ? (totalBookings / totalRooms) * 100 : 0;

    return {
      precomputedData,
      realTimeData: {
        totalBookings,
        canceledBookings,
        totalRevenue,
        averageRevenue,
        occupancyRate,
      },
    };
  }

  async getRealTimeBookingAnalytics(
    hotelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    precomputedData: BookingAnalytics[];
    realTimeData: {
      totalBookings: number;
      canceledBookings: number;
      totalRevenue: number;
      averageRevenue: number;
      occupancyRate: number;
    };
  }> {
    const cacheKey = `analytics_${hotelId}_${startDate.toISOString()}_${endDate.toISOString()}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log("Presenting cached analytics data");
      return JSON.parse(cached);
    }

    const data = await this.calculateRealTimeBookingAnalytics(
      hotelId,
      startDate,
      endDate
    );
    // Cache the result for 10 minutes
    await cacheService.set(cacheKey, JSON.stringify(data), 600);
    return data;
  }

  async calculateOccupancyData(
    hotelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalBookedRooms: number;
    totalRooms: number;
    totalAvailableRooms: number;
    occupancyRate: number;
  }> {
    const totalRooms = (await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { rooms:true },
    }))?.rooms.length || 0;

    if (totalRooms === 0)
      return {
        totalBookedRooms: 0,
        totalRooms,
        totalAvailableRooms: 0,
        occupancyRate: 0,
      };
    const totalBookedRooms = await prisma.booking.count({
      where: {
        hotelId,
        status: BookingStatus.CONFIRMED,
        AND: [
          {
            checkIn: { gte: startDate },
          },
          {
            checkOut: { lte: endDate },
          },
        ],
      },
    });

    return {
      totalBookedRooms,
      totalAvailableRooms: totalRooms - totalBookedRooms,
      totalRooms,
      occupancyRate: (totalBookedRooms / totalRooms) * 100,
    };
  }
}
