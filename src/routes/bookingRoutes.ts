import express from 'express';
import { requireAuth } from '@clerk/express';
import {
  createBooking,
  getBookingById,
  updateBooking,
  cancelBooking,
  getUserBookings,
  getHotelBookings,
  updatePaymentStatus,
  getHotelBookingsByStatus,
  getFilteredHotelBookings
} from '../controllers/bookingController';

const router = express.Router();

// All routes are protected
router.use(requireAuth());

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelId
 *               - roomId
 *               - customerId
 *               - checkIn
 *               - checkOut
 *               - guests
 *             properties:
 *               hotelId:
 *                 type: string
 *               roomId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *               guests:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *               payment:
 *                 type: object
 *                 properties:
 *                   totalAmount:
 *                     type: number
 *                   paidAmount:
 *                     type: number
 *                   status:
 *                     type: string
 *                     enum: [PENDING, PAID, REFUNDED, FAILED]
 *                   transactionId:
 *                     type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Room is not available for the selected dates
 */
router.post('/', createBooking);

/**
 * @swagger
 * /api/bookings/user:
 *   get:
 *     summary: Get all bookings of current user
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get('/user', getUserBookings);

/**
 * @swagger
 * /api/bookings/hotel/{hotelId}:
 *   get:
 *     summary: Get all bookings of a hotel
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the hotel
 *     responses:
 *       200:
 *         description: List of hotel's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get('/hotel/:hotelId', getHotelBookings);

/**
 * @swagger
 * /api/bookings/hotel/{hotelId}/filter:
 *   get:
 *     summary: Get filtered hotel bookings
 *     tags: [Bookings]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *         description: Booking status filter
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [today, yesterday, thisWeek, thisMonth, custom]
 *         description: Predefined time range filter
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom range (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom range (YYYY-MM-DD)
 *       - in: query
 *         name: roomStatus
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, BOOKED, MAINTENANCE]
 *         description: Room status filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [checkIn, checkOut, bookingTime]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of filtered hotel bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get('/hotel/:hotelId/filter', getFilteredHotelBookings);

/**
 * @swagger
 * /api/bookings/{hotelId}/{status}:
 *   get:
 *     summary: Get all bookings of a hotel by status
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the hotel
 *       - in: path
 *         name: status
 *         schema:
 *           type: string
 *         required: true
 *         description: Status of the bookings
 *     responses:
 *       200:
 *         description: List of hotel's bookings by status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get('/:hotelId/:status', getHotelBookingsByStatus);

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the booking
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 */
router.get('/:bookingId', getBookingById);

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   put:
 *     summary: Update booking details
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkIn:
 *                 type: string
 *                 format: date-time
 *               checkOut:
 *                 type: string
 *                 format: date-time
 *               guests:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 */
router.put('/:bookingId', updateBooking);

/**
 * @swagger
 * /api/bookings/{bookingId}:
 *   delete:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the booking
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 */
router.delete('/:bookingId', cancelBooking);

/**
 * @swagger
 * /api/bookings/{bookingId}/payment:
 *   patch:
 *     summary: Update payment status and respective booking and room status
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PAID, REFUNDED, FAILED]
 *               paidAmount:
 *                 type: number
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       206:
 *         description: Payment Done, not booking status
 *         content:
 *           application/json:
 *                 message:
 *                   type: string
 *       404:
 *         description: Payment not found
 */
router.patch('/:bookingId/payment', updatePaymentStatus);

export default router; 