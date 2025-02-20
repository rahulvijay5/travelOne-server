// src/routes/analyticsRoutes.ts

import express from "express";
import rateLimit from "express-rate-limit";
import { getBookingAnalytics, getOccupancyData } from "@/controllers/analyticsContoller";
import { requireAuth } from "@clerk/express";

const router = express.Router();

// Create a rate limiter for analytics endpoints
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all analytics routes
router.use(analyticsLimiter);

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
 *       400:
 *         description: Invalid parameters
 *       429:
 *         description: Too many requests from this IP
 *       500:
 *         description: Server error
 */
router.get('/:hotelId', requireAuth(), getBookingAnalytics);

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
 *       400:
 *         description: Invalid parameters
 *       404:
 *         description: Hotel not found
 *       429:
 *         description: Too many requests from this IP
 *       500:
 *         description: Server error
 */
router.get('/:hotelId/occupancy', requireAuth(), getOccupancyData);

export default router;