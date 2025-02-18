// src/routes/analyticsRoutes.ts

import express from "express";
import { getBookingAnalytics, getOccupancyData } from "@/controllers/analyticsContoller";

const router = express.Router();

/**
 * @swagger
 * /api/analytics/{hotelId}:
 *   get:
 *     summary: Get booking analytics for a hotel within a date range
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for analytics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Booking analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 precomputedData:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BookingAnalytics'
 *                 realTimeData:
 *                   type: object
 *                   properties:
 *                     totalBookings:
 *                       type: integer
 *                     canceledBookings:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     averageRevenue:
 *                       type: number
 *                     occupancyRate:
 *                       type: number
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/:hotelId', getBookingAnalytics);


/**
 * @swagger
 * /api/analytics/{hotelId}/occupancy:
 *   get:
 *     summary: Get occupancy data for a hotel within a date range
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for analytics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Booking analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 precomputedData:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BookingAnalytics'
 *                 realTimeData:
 *                   type: object
 *                   properties:
 *                     totalBookings:
 *                       type: integer
 *                     canceledBookings:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 *                     averageRevenue:
 *                       type: number
 *                     occupancyRate:
 *                       type: number
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/:hotelId/occupancy', getOccupancyData);

export default router;