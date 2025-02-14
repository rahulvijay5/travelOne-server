import prisma from "../config/database";
import { PushToken, User } from "@prisma/client";
import { sendPushNotifications } from "../config/sendPushNotifications";
import { BookingNotificationType, BookingNotificationData } from "@/types";

class NotificationService {
  async registerPushToken(userId: string, pushToken: string): Promise<{ message: string; token?: PushToken }> {
    try {
      // Validate user existence
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Check if the push token already exists
      const existingToken = await prisma.pushToken.findUnique({
        where: { token: pushToken }
      });
      console.log("Token already exists", existingToken);

      if (existingToken) {
        // If token exists but for a different user, update it
        if (existingToken.userId !== userId) {
          const updatedToken = await prisma.pushToken.update({
            where: { id: existingToken.id },
            data: { userId }
          });
          return { 
            message: "Push token reassigned to new user",
            token: updatedToken
          };
        }
        return { 
          message: "Push token already registered",
          token: existingToken
        };
      }

      // Create new push token associated with user
      const newPushToken = await prisma.pushToken.create({
        data: {
          token: pushToken,
          userId
        }
      });
      console.log("New token created", newPushToken);

      return { 
        message: "Push token registered successfully",
        token: newPushToken
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to register push token: ${error.message}`);
      }
      throw new Error("Failed to register push token");
    }
  }

  async sendBookingNotification(
    bookingId: string,
    hotelId: string,
    type: BookingNotificationType
  ): Promise<void> {
    try {
      // Get booking details with related data
      console.log(("Using send booking notfication service"))
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          hotel: {
            include: {
              managers: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phoneNumber: true,
                }
              }
            }
          },
          room: {
            select: {
              roomNumber: true,
            }
          },
          customer: {
            select: {
              name: true,
            }
          }
        }
      });
      console.log("found this booking", booking);
      if (!booking) {
        throw new Error("Booking not found");
      }

      // Get all users who should receive the notification (hotel owners, managers)
      const recipientIds = [
        // ...booking.hotel.owner.map(owner => owner.id),
        ...booking.hotel.managers.map(manager => manager.id)
      ];
      console.log("recipientIds", recipientIds);
      // Get push tokens for all recipients
      const pushTokens = await prisma.pushToken.findMany({
        where: {
          userId: {
            in: recipientIds
          }
        }
      });
      console.log("pushTokens", pushTokens);
      const tokens = pushTokens.map(token => token.token);

      if (tokens.length === 0) {
        console.log("No push tokens found for notification recipients");
        return;
      }

      // Prepare notification content based on type
      let title: string;
      let body: string;
      const data: BookingNotificationData = { bookingId, type };

      switch (type) {
        case BookingNotificationType.CREATED:
          title = 'New Booking Received 🎉';
          body = `New booking for Room ${booking.room.roomNumber} by ${booking.customer.name}`;
          break;
        case BookingNotificationType.UPDATED:
          title = 'Booking Updated 🔄';
          body = `Booking for Room ${booking.room.roomNumber} has been updated`;
          break;
        case BookingNotificationType.CANCELLED:
          title = 'Booking Cancelled 🚫';
          body = `Booking for Room ${booking.room.roomNumber} has been cancelled`;
          break;
        case BookingNotificationType.COMPLETED:
          title = 'Booking Completed 🎉';
          body = `Booking for Room ${booking.room.roomNumber} has been completed`;
          break;
      }

      // Send push notifications
      await sendPushNotifications(tokens, title, body, data);

      // Log notification for tracking
      await prisma.notification.create({
        data: {
          title,
          body,
          type,
          bookingId,
          hotelId,
          recipients: {
            connect: recipientIds.map(id => ({ id }))
          }
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to send booking notification: ${error.message}`);
      }
      throw new Error("Failed to send booking notification");
    }
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    notifications: any[];
    pagination: {
      total: number;
      pages: number;
      currentPage: number;
      limit: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: {
            recipients: {
              some: {
                id: userId
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit,
          include: {
            booking: {
              include: {
                room: true,
                customer: true
              }
            }
          }
        }),
        prisma.notification.count({
          where: {
            recipients: {
              some: {
                id: userId
              }
            }
          }
        })
      ]);

      return {
        notifications,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch user notifications: ${error.message}`);
      }
      throw new Error("Failed to fetch user notifications");
    }
  }

  async sendBookingCancelNotification(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          hotel: {
            include: {
              managers: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
          room: {
            select: {
              roomNumber: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      const recipientIds = [
        // ...booking.hotel.owner.map(owner => owner.id),
        ...booking.hotel.managers.map(manager => manager.id),
        booking.customer.id,
      ];

      const pushTokens = await prisma.pushToken.findMany({
        where: {
          userId: {
            in: recipientIds,
          },
        },
      });

      const tokens = pushTokens.map(token => token.token);

      if (tokens.length === 0) {
        console.log("No push tokens found for notification recipients");
        return;
      }

      const title = 'Booking Automatically Cancelled 🚫';
      const body = `Your booking for Room ${booking.room.roomNumber} has been automatically cancelled due to inactivity.`;
      const data: BookingNotificationData = { bookingId, type: BookingNotificationType.CANCELLED };

      await sendPushNotifications(tokens, title, body, data);

      // Log the notification in the database
      await prisma.notification.create({
        data: {
          title,
          body,
          type: BookingNotificationType.CANCELLED,
          bookingId: booking.id,
          hotelId: booking.hotelId,
          recipients: {
            connect: recipientIds.map(id => ({ id })),
          },
        },
      });

      console.log(`Cancellation notification sent for booking ID: ${booking.id}`);
    } catch (error) {
      console.error('Error sending cancellation notification:', error);
    }
  }
}



export default NotificationService;
