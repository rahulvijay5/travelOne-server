import { Request, Response } from "express";
import { BookingService } from "../services/bookingService";
import { BookingStatus, PaymentStatus, RoomStatus } from "@prisma/client";
import { RoomService } from "@/services/roomService";

const bookingService = new BookingService();
const roomService = new RoomService();

export const createBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const bookingData = req.body;
    const booking = await bookingService.createBooking(bookingData);
    res.status(201).json(booking);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "Room is not available for the selected dates or it is already booked."
    ) {
      res.status(400).json({ error: error.message });
    } else {
      console.error("Error creating booking:", error);
      res.status(500).json({ error });
    }
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
    // console.log("Booking: ", booking);
    res.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ error: "Error fetching booking" });
  }
};

export const checkBookingStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = await bookingService.checkStatusOfBooking(bookingId);
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    res.status(200).json({ booking });
  } catch (error) {
    console.error("Error checking booking status:", error);
    res.status(500).json({ error: "Error checking booking status" });
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

export const getCurrentBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { clerkId } = req.params;
    const booking = await bookingService.getCurrentBooking(clerkId);
    if (!booking) {
      res.status(404).json({ message: "No current booking found" });
      return;
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching current booking:", error);
    res.status(500).json({ error: "Error fetching current booking" });
  }
};

export const getHotelBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const bookings = await bookingService.getHotelBookings(hotelId);
    if (!bookings) {
      res.status(404).json({ error: "Bookings not found" });
      return;
    }
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching hotel bookings:", error);
    res.status(500).json({ error: "Error fetching hotel bookings" });
  }
};

export const getHotelBookingsByStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId, status } = req.params;
    const bookings = await bookingService.getHotelBookingsByStatus(
      hotelId,
      status as BookingStatus
    );
    if (!bookings) {
      res
        .status(404)
        .json({ error: `Bookings with ${status} status not found` });
      return;
    }
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching hotel bookings by status:", error);
    res.status(500).json({ error: "Error fetching hotel bookings by status" });
  }
};

export const getFilteredHotelBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const {
      status,
      timeRange,
      startDate,
      endDate,
      roomStatus,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    // Validate and parse query parameters
    const filters = {
      status: status as BookingStatus,
      timeRange: timeRange as
        | "today"
        | "yesterday"
        | "thisWeek"
        | "thisMonth"
        | "custom",
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      roomStatus: roomStatus as RoomStatus,
      sortBy: sortBy as "checkIn" | "checkOut" | "bookingTime",
      sortOrder: sortOrder as "asc" | "desc",
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    };

    // Validate date range if custom timeRange
    if (filters.timeRange === "custom") {
      if (!filters.startDate || !filters.endDate) {
        res
          .status(400)
          .json({
            error: "startDate and endDate are required for custom timeRange",
          });
        return;
      }
      if (filters.startDate > filters.endDate) {
        res
          .status(400)
          .json({ error: "startDate must be before or equal to endDate" });
        return;
      }
    }

    const result = await bookingService.getFilteredHotelBookings(
      hotelId,
      filters
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching filtered hotel bookings:", error);
    res.status(500).json({ error: "Error fetching filtered hotel bookings" });
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

    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    let responseMessage = "Payment status updated";
    let responseData: any = { payment };

    if (payment.status === PaymentStatus.PAID) {
      const booking = await bookingService.updateBooking(bookingId, {
        status: BookingStatus.CONFIRMED,
      });
      responseMessage = "Payment Done, booking status updated";
      responseData.booking = booking;
    } else if (payment.status === PaymentStatus.FAILED) {
      const booking = await bookingService.updateBooking(bookingId, {
        status: BookingStatus.CANCELLED,
      });
      await roomService.updateRoomStatus(booking.roomId, RoomStatus.AVAILABLE);
      responseMessage = "Payment Failed, booking status updated";
      responseData.booking = booking;
    }

    res.status(200).json({
      message: responseMessage,
      ...responseData,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ error: "Error updating payment status" });
  }
};

export const makeBookingCheckout = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingId } = req.params;
    const booking = await bookingService.makeCheckout(bookingId);
    console.log("Checked out booking: ", booking);
    res.status(200).json({
      message: "Booking checked out successfully",
      booking,
    });
  } catch (error) {
    console.error("Error checking out booking:", error);
    if (error instanceof Error) {
      if (error.message === "Booking not found") {
        res.status(404).json({ error: error.message });
      } else if (
        error.message === "Only confirmed bookings can be checked out"
      ) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({
          error: "Error checking out booking",
          details: error.message,
        });
      }
    } else {
      res.status(500).json({ error: "Error checking out booking" });
    }
  }
};