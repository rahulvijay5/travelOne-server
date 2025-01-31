import express from 'express';
import { requireAuth } from '@clerk/express';
import {
  createHotel,
  getHotelById,
  updateHotel,
  deleteHotel,
  getAllHotels,
  searchHotels,
  addManager,
  removeManager,
  updateHotelRules,
  getHotelsByOwnerId,
  getAllManagersOfHotel
} from '../controllers/hotelController';

const router = express.Router();

// All routes are protected
router.use(requireAuth());

/**
 * @swagger
 * /api/hotels:
 *   post:
 *     summary: Create a new hotel
 *     tags: [Hotels]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hotelName
 *               - description
 *               - location
 *               - address
 *               - totalRooms
 *               - contactNumber
 *               - owner
 *             properties:
 *               hotelName:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               address:
 *                 type: string
 *               totalRooms:
 *                 type: integer
 *               contactNumber:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *               hotelImages:
 *                 type: array
 *                 items:
 *                   type: string
 *               owner:
 *                 type: string
 *     responses:
 *       201:
 *         description: Hotel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 */
router.post('/', createHotel);

/**
 * @swagger
 * /api/hotels:
 *   get:
 *     summary: Get all hotels
 *     tags: [Hotels]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotel'
 */
router.get('/', getAllHotels);

/**
 * @swagger
 * /api/hotels/search:
 *   get:
 *     summary: Search hotels
 *     tags: [Hotels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query for hotel name, description, or address
 *     responses:
 *       200:
 *         description: List of hotels matching the search query
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotel'
 */
router.get('/search', searchHotels);

/**
 * @swagger
 * /api/hotels/{hotelId}:
 *   get:
 *     summary: Get hotel by ID
 *     tags: [Hotels]
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
 *         description: Hotel details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Hotel not found
 */
router.get('/:hotelId', getHotelById);

/**
 * @swagger
 * /api/hotels/owner/{ownerId}:
 *   get:
 *     summary: Get hotels by owner ID
 *     tags: [Hotels]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the owner
 *     responses:
 *       200:
 *         description: Hotel details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Hotel not found
 */
router.get('/owner/:ownerId', getHotelsByOwnerId);

/**
 * @swagger
 * /api/hotels/{hotelId}:
 *   put:
 *     summary: Update hotel details
 *     tags: [Hotels]
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
 *             $ref: '#/components/schemas/Hotel'
 *     responses:
 *       200:
 *         description: Hotel updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: Hotel not found
 */
router.put('/:hotelId', updateHotel);

/**
 * @swagger
 * /api/hotels/{hotelId}:
 *   delete:
 *     summary: Delete a hotel
 *     tags: [Hotels]
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
 *       204:
 *         description: Hotel deleted successfully
 */
router.delete('/:hotelId', deleteHotel);

/**
 * @swagger
 * /api/hotels/{hotelId}/rules:
 *   put:
 *     summary: Update hotel rules
 *     tags: [Hotels]
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
 *             properties:
 *               petsAllowed:
 *                 type: boolean
 *               maxPeopleInOneRoom:
 *                 type: integer
 *               extraMattressOnAvailability:
 *                 type: boolean
 *               parking:
 *                 type: boolean
 *               swimmingPool:
 *                 type: boolean
 *               swimmingPoolTimings:
 *                 type: string
 *               ownRestaurant:
 *                 type: boolean
 *               checkInTime:
 *                 type: string
 *               checkOutTime:
 *                 type: string
 *               guestInfoNeeded:
 *                 type: boolean
 *               smokingAllowed:
 *                 type: boolean
 *               alcoholAllowed:
 *                 type: boolean
 *               eventsAllowed:
 *                 type: boolean
 *               minimumAgeForCheckIn:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Hotel rules updated successfully
 */
router.put('/:hotelId/rules', updateHotelRules);

/**
 * @swagger
 * /api/hotels/{hotelId}/managers:
 *   post:
 *     summary: Add a manager to hotel
 *     tags: [Hotels]
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
 *               - managerId
 *             properties:
 *               managerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Manager added successfully
 */
router.post('/:hotelId/managers', addManager);

/**
 * @swagger
 * /api/hotels/{hotelId}/managers:
 *   get:
 *     summary: Get all managers of hotel
 *     tags: [Hotels]
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
 *         description: List of managers
 */
router.get('/:hotelId/managers', getAllManagersOfHotel);

/**
 * @swagger
 * /api/hotels/{hotelId}/managers/{managerId}:
 *   delete:
 *     summary: Remove a manager from hotel
 *     tags: [Hotels]
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
 *         name: managerId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the manager
 *     responses:
 *       200:
 *         description: Manager removed successfully
 */
router.delete('/:hotelId/managers/:managerId', removeManager);

export default router; 