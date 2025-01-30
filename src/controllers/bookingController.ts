import { Request, Response } from "express";
import { BookingService } from "../services/bookingService";
import { BookingStatus, PaymentStatus } from "@prisma/client";

const bookingService = new BookingService();

export const createBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookingData = req.body;
    const booking = await bookingService.createBooking(bookingData);
    res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Error creating booking" });
  }
};

export const getBookingById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = await bookingService.getBookingById(bookingId);
    
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Error fetching booking" });
  }
};

export const updateBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const updateData = req.body;
    const booking = await bookingService.updateBooking(bookingId, updateData);
    
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    res.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Error updating booking" });
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = await bookingService.cancelBooking(bookingId);
    
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    res.json(booking);
  } catch (error) {
    console.error("Error canceling booking:", error);
    res.status(500).json({ error: "Error canceling booking" });
  }
};

export const getUserBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const bookings = await bookingService.getUserBookings(userId);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ error: "Error fetching user bookings" });
  }
};

export const getHotelBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const bookings = await bookingService.getHotelBookings(hotelId);
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching hotel bookings:", error);
    res.status(500).json({ error: "Error fetching hotel bookings" });
  }
};

export const updatePaymentStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const { status, transactionId, paidAmount } = req.body;

    // Validate payment status
    if (!Object.values(PaymentStatus).includes(status)) {
      res.status(400).json({ error: "Invalid payment status" });
      return;
    }

    const payment = await bookingService.updatePaymentStatus(bookingId, {
      status,
      transactionId,
      paidAmount,
    });

    res.json(payment);
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Error updating payment status" });
  }
}; 