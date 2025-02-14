import { Router } from 'express';
import { registerPushToken, getUserNotifications } from '../controllers/notificationController';
import { requireAuth } from '@clerk/express';

const router = Router();

// All routes are protected
router.use(requireAuth());

/**
 * @swagger
 * /api/notifications/register-token:
 *   post:
 *     summary: Register a push notification token for a user
 *     description: Register or update a device push notification token for a specific user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - pushToken
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user
 *               pushToken:
 *                 type: string
 *                 description: Device push notification token
 *             example:
 *               userId: "user-uuid"
 *               pushToken: "device-push-token"
 *     responses:
 *       201:
 *         description: Push token registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     token:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 example:
 *                   type: object
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/register-token', registerPushToken);

/**
 * @swagger
 * /api/notifications/user/{userId}:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve paginated list of notifications for a specific user
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       body:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [created, updated, cancelled, completed]
 *                       booking:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           room:
 *                             type: object
 *                           customer:
 *                             type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', getUserNotifications);

export default router;