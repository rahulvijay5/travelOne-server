import { Request, Response } from 'express';
import NotificationService from '../services/notificationService';

const notificationService = new NotificationService();

export const registerPushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, pushToken } = req.body;

    if (!userId || !pushToken) {
      res.status(400).json({ 
        error: 'User ID and push token are required',
        example: {
          userId: "user-uuid",
          pushToken: "device-push-token"
        }
      });
      return;
    }

    const result = await notificationService.registerPushToken(userId, pushToken);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error registering push token:', error);
    if (error instanceof Error) {
      if (error.message.includes('User not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ 
        error: 'Failed to register push token',
        details: error.message 
      });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    if (page < 1 || limit < 1 || limit > 50) {
      res.status(400).json({ 
        error: 'Invalid pagination parameters',
        details: 'Page must be >= 1 and limit must be between 1 and 50'
      });
      return;
    }

    const result = await notificationService.getUserNotifications(userId, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to fetch notifications',
        details: error.message 
      });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};