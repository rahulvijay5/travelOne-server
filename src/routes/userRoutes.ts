import express from 'express';
import { createUser, searchUsers, getUserById,updateUserRole } from '../controllers/userController';
import { requireAuth } from '@clerk/express';

const router = express.Router();

// Public routes
router.post('/', createUser);
router.post('/update-role',updateUserRole)

// Protected routes
router.get('/search', requireAuth(), searchUsers);
router.get('/:userId', requireAuth(), getUserById);

export default router; 