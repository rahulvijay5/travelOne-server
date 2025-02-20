// src/controllers/analyticsController.ts

import { Request, Response } from "express";
import { AnalyticsService } from "../services/analyticsService";
import { getDateRange } from "@/config/timeframe";
import { Timeframe } from "@/types/index";

const analyticsService = new AnalyticsService();

/**
 * @swagger
 * /api/analytics/{hotelId}:
 *   get:
 *     summary: Get booking analytics for a hotel within a specified timeframe
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the hotel
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [today, tomorrow, thisWeek, currentMonth]
 *         required: false
 *         description: Timeframe for analytics data
 *     responses:
 *       200:
 *         description: Booking analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue:
 *                   type: number
 *                 totalBookings:
 *                   type: integer
 *                 pendingBookings:
 *                   type: integer
 *                 occupancyRate:
 *                   type: number
 *                 confirmedBookings:
 *                   type: integer
 *                 completedBookings:
 *                   type: integer
 *                 cancelledBookings:
 *                   type: integer
 *                 availableRooms:
 *                   type: integer
 *                 calculatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid parameters
 *       429:
 *         description: Too many requests from this IP
 *       500:
 *         description: Server error
 */
export const getBookingAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { timeframe } = req.query;

    let selectedTimeframe: Timeframe = 'today'; // Default timeframe

    if (timeframe) {
      if (
        typeof timeframe === 'string' &&
        ['today', 'tomorrow', 'thisWeek', 'currentMonth'].includes(timeframe)
      ) {
        selectedTimeframe = timeframe as Timeframe;
      } else {
        res.status(400).json({ error: "Invalid timeframe provided" });
        return;
      }
    }

    const data = await analyticsService.getBookingAnalyticsWithCaching(hotelId, selectedTimeframe);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching booking analytics:", error);
    res.status(500).json({ error: "Error fetching booking analytics" });
  }
};

/**
 * @swagger
 * /api/analytics/{hotelId}/occupancy:
 *   get:
 *     summary: Get occupancy data for a hotel within a specified timeframe
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the hotel
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [today, tomorrow, thisWeek, currentMonth]
 *         required: false
 *         description: Timeframe for occupancy data
 *     responses:
 *       200:
 *         description: Occupancy data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRooms:
 *                   type: integer
 *                 totalAvailableRooms:
 *                   type: integer
 *                 totalBookedRooms:
 *                   type: integer
 *                 pendingBookings:
 *                   type: integer
 *                 confirmedBookings:
 *                   type: integer
 *                 cancelledBookings:
 *                   type: integer
 *                 completedBookings:
 *                   type: integer
 *                 occupancyRate:
 *                   type: number
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: Hotel not found
 *       429:
 *         description: Too many requests from this IP
 *       500:
 *         description: Server error
 */
export const getOccupancyData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { timeframe } = req.query;

    let selectedTimeframe: Timeframe = 'today'; // Default timeframe

    if (timeframe) {
      if (
        typeof timeframe === 'string' &&
        ['today', 'tomorrow', 'thisWeek', 'currentMonth'].includes(timeframe)
      ) {
        selectedTimeframe = timeframe as Timeframe;
      } else {
        res.status(400).json({ error: "Invalid timeframe provided" });
        return;
      }
    }

    const { startDate, endDate } = getDateRange(selectedTimeframe);

    const data = await analyticsService.calculateOccupancyData(hotelId, startDate, endDate);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching occupancy data:", error);
    res.status(500).json({ error: "Error fetching occupancy data" });
  }
};