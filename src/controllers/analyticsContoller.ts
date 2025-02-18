// src/controllers/analyticsController.ts

import { Request, Response } from "express";
import { AnalyticsService } from "../services/analyticsService";

const analyticsService = new AnalyticsService();

export const getBookingAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate and endDate are required" });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
      return;
    }

    const data = await analyticsService.getRealTimeBookingAnalytics(hotelId, start, end);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching booking analytics:", error);
    res.status(500).json({ error: "Error fetching booking analytics" });
  }
  };

export const getOccupancyData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };

    if (!startDate || !endDate) {
      res.status(400).json({ error: "startDate and endDate are required" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
      return;
    }

    const data = await analyticsService.calculateOccupancyData(hotelId, start, end);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching occupancy data:", error);
    res.status(500).json({ error: "Error fetching occupancy data" });
  }
};
