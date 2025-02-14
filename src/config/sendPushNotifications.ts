import { Expo } from 'expo-server-sdk';
import { BookingNotificationData } from '@/types';

const expo = new Expo();

/**
 * Sends push notifications to an array of Expo push tokens.
 * @param pushTokens Array of Expo push tokens.
 * @param title Notification title.
 * @param body Notification body.
 * @param data Additional data to send with the notification.
 */
export const sendPushNotifications = async (
  pushTokens: string[],
  title: string,
  body: string,
  data?: BookingNotificationData
): Promise<void> => {
  let messages: any[] = [];

  for (let pushToken of pushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    });
  }
  console.log("messages", messages);

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  try {
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      console.log("ticketChunk", ticketChunk);
    }
    console.log("tickets", tickets);
    console.log('Push notifications sent successfully');
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
};