import express from 'express';
import { requireAuth } from '@clerk/express';
import {
  createRoom,
  createMultipleRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getHotelRooms,
  getHotelRoomsByStatus,
  updateRoomStatus,
} from '../controllers/roomController';

const router = express.Router();

/**
 * @swagger
 * /api/rooms/hotel/{hotelId}/{roomStatus}:
 *   get:
 *     summary: Get all rooms of a hotel by status
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: string
 *         required: true
  *         description: ID of the hotel
 *       - in: path
 *         name: roomStatus
 *         schema:
 *           type: string
 *         required: true
 *         description: Status of the room
 *     responses:
 *       200:
 *         description: List of rooms in the hotel with the given status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *       404:
 *         description: Rooms not found
 */
router.get('/hotel/:hotelId/:roomStatus', getHotelRoomsByStatus);

// All routes are protected
router.use(requireAuth());

/**
 * @swagger
 * /api/rooms/hotel/{hotelId}:
 *   get:
 *     summary: Get all rooms of a hotel
 *     tags: [Rooms]
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
 *         description: List of rooms in the hotel
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
router.get('/hotel/:hotelId', getHotelRooms);

/**
 * @swagger
 * /api/rooms/hotel/{hotelId}:
 *   post:
 *     summary: Create a new room in a hotel
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the hotel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - price
 *               - maxOccupancy
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               price:
 *                 type: number
 *               maxOccupancy:
 *                 type: integer
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 */
router.post('/hotel/:hotelId', createRoom);


/**
 * @swagger
 * /api/rooms/multiple/{hotelId}:
 *   post:
 *     summary: Create multiple rooms in a hotel
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the hotel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - price
 *               - maxOccupancy
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               price:
 *                 type: number
 *               maxOccupancy:
 *                 type: integer
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Rooms created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 */
router.post('/multiple/:hotelId', createMultipleRooms);

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the room
 *     responses:
 *       200:
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 */
router.get('/:roomId', getRoomById);

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   put:
 *     summary: Update room details
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the room
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 */
router.put('/:roomId', updateRoom);

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   delete:
 *     summary: Delete a room
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the room
 *     responses:
 *       204:
 *         description: Room deleted successfully
 */
router.delete('/:roomId', deleteRoom);

/**
 * @swagger
 * /api/rooms/{roomId}/status:
 *   patch:
 *     summary: Update room status
 *     tags: [Rooms]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the room
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - available
 *             properties:
 *               available:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Room availability updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 */
router.patch('/:roomId/status', updateRoomStatus);

export default router; 