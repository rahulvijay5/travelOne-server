// src/utils/scheduler.ts

import cron from "node-cron";
import { AnalyticsService } from "../services/analyticsService";
import prisma from "./database";

// Instantiate the service
const analyticsService = new AnalyticsService();

/**
 * Schedule the analytics computation to run daily at midnight.
 */
const scheduleDailyAnalytics = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("🕛 Starting daily booking analytics computation...");
    try {
      const hotels = await prisma.hotel.findMany({
        select: { id: true },
      });

      const today = new Date();
      for (const hotel of hotels) {
        await analyticsService.computeDailyBookingAnalytics(hotel.id, today);
        console.log(`✅ Analytics computed for hotel ID: ${hotel.id}`);
      }

      console.log("🎉 Daily booking analytics computation completed successfully.");
    } catch (error) {
      console.error("❌ Error during analytics computation:", error);
    }
  });
};

export const initializeScheduler = () => {
  scheduleDailyAnalytics();
};