import express from 'express';
import { createUser, searchUsers, updateUserRole, getUserProfile, getUserByClerkId, getCurrentManagingHotel } from '../controllers/userController';
import { requireAuth } from '@clerk/express';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - email
 *               - name
 *               - clerkId
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               clerkId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, OWNER, MANAGER, CUSTOMER]
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: User already exists
 */
router.post('/', createUser);

/**
 * @swagger
 * /api/users/update-role:
 *   post:
 *     summary: Update user role
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clerkId
 *               - role
 *             properties:
 *               clerkId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, OWNER, MANAGER, CUSTOMER]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post('/update-role', requireAuth(), updateUserRole);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query for name, email, or phone number
 *     responses:
 *       200:
 *         description: List of users matching the search query
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/search', requireAuth(), searchUsers);

/**
 * @swagger
 * /api/users/currentManagingHotel/{userId}:
 *   get:
 *     summary: Get the current managing hotel for a user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: userId of the user
 *     responses:
 *       200:
 *         description: Current managing hotel details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       404:
 *         description: User not found
 */
router.get('/currentManagingHotel/:userId', requireAuth(), getCurrentManagingHotel);

/**
 * @swagger
 * /api/users/{clerkId}:
 *   get:
 *     summary: Get user by clerkId
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clerkId
 *         schema:
 *           type: string
 *         required: true
 *         description: clerkId of the user
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/:clerkId', requireAuth(), getUserByClerkId);

router.get('/user-profile/:userId', requireAuth(), getUserProfile);

export default router; 