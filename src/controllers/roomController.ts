import { Request, Response } from "express";
import { RoomService } from "../services/roomService";
import { RoomStatus } from "@prisma/client";

const roomService = new RoomService();

export const createRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const roomData = { ...req.body, hotelId };
    const room = await roomService.createRoom(roomData);
    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Error creating room" });
  }
};

export const createMultipleRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const roomsData = { hotelId, rooms: req.body.rooms };
    console.log("Rooms data: ", roomsData);
    const result = await roomService.createMultipleRooms(roomsData);
    res.status(201).json({
      message: `Successfully created ${result.count} rooms`,
      ...result,
    });
  } catch (error) {
    console.error("Error creating multiple rooms:", error);
    res.status(500).json({ error: "Error creating multiple rooms" });
  }
};

export const getRoomById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { roomId } = req.params;
    const room = await roomService.getRoomById(roomId);

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ error: "Error fetching room" });
  }
};

export const updateRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { roomId } = req.params;
    const updateData = req.body;
    updateData.price = parseFloat(updateData.price);
    updateData.maxOccupancy = parseFloat(updateData.maxOccupancy);
    const room = await roomService.updateRoom(roomId, updateData);

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.json(room);
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ error: "Error updating room" });
  }
};

export const deleteRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { roomId } = req.params;
    await roomService.deleteRoom(roomId);
    res.status(200).json({
      message: "Room and associated images deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    if (error instanceof Error) {
      res.status(500).json({
        error: "Error deleting room",
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: "Error deleting room",
      });
    }
  }
};

export const getHotelRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const rooms = await roomService.getHotelRooms(hotelId);
    console.log("Got hotel rooms: ", rooms);
    if (!rooms) {
      res.status(404).json({ error: "Rooms not found" });
      return;
    }

    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error fetching hotel rooms:", error);
    res.status(500).json({ error: "Error fetching hotel rooms" });
  }
};

export const getHotelRoomsByStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId, roomStatus } = req.params;
    const rooms = await roomService.getHotelRoomsByStatus(
      hotelId,
      roomStatus as RoomStatus
    );

    if (!rooms) {
      res.status(404).json({ error: "Rooms not found" });
      return;
    }

    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error fetching hotel rooms by status:", error);
    res.status(500).json({ error: "Error fetching hotel rooms by status" });
  }
};

export const updateRoomStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { roomStatus } = req.body;

    if (!Object.values(RoomStatus).includes(roomStatus as RoomStatus)) {
      res.status(400).json({ error: "Room status must be a valid RoomStatus" });
      return;
    }

    const room = await roomService.updateRoomStatus(
      roomId,
      roomStatus as RoomStatus
    );

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.status(200).json(room);
  } catch (error) {
    console.error("Error updating room status:", error);
    res.status(500).json({ error: "Error updating room status" });
  }
};

export const getAvailableRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const {
      checkIn,
      checkOut,
      guests,
      roomType,
      maxPrice,
      features,
      page,
      limit,
    } = req.query;

    // Validate required parameters
    if (!checkIn || !checkOut || !guests) {
      res.status(400).json({
        error: "checkIn, checkOut, and guests are required parameters",
        example: {
          checkIn: "2024-02-15T14:00:00Z", // ISO 8601 format
          checkOut: "2024-02-16T10:00:00Z",
          guests: "2",
        },
      });
      return;
    }

    // Parse and validate dates
    const checkInDate = new Date(checkIn as string);
    const checkOutDate = new Date(checkOut as string);
    const today = new Date();
    const lastDay = new Date();
    lastDay.setDate(lastDay.getDate() - 1);

    console.log("Check-in date: ", checkInDate);
    console.log("Check-out date: ", checkOutDate);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400).json({
        error:
          "Invalid date format. Use ISO 8601 format (e.g., 2024-02-15T14:00:00Z)",
      });
      console.log("Invalid date format: ", checkInDate, checkOutDate);
      return;
    }

    if (checkOutDate <= checkInDate) {
      res.status(400).json({
        error: "Check-out date must be after check-in date",
      });
      console.log(
        "Check-out date must be after check-in date: ",
        checkOutDate,
        checkInDate
      );
      return;
    }

    // Parse and validate guests
    const guestsCount = parseInt(guests as string);
    if (isNaN(guestsCount) || guestsCount < 1) {
      res.status(400).json({
        error: "Number of guests must be a positive integer",
      });
      console.log("Number of guests must be a positive integer: ", guestsCount);
      return;
    }

    // Parse optional parameters
    const parsedMaxPrice = maxPrice
      ? parseFloat(maxPrice as string)
      : undefined;
    const parsedFeatures = features
      ? (features as string).split(",")
      : undefined;
    const parsedPage = page ? parseInt(page as string) : undefined;
    const parsedLimit = limit ? parseInt(limit as string) : undefined;

    const result = await roomService.getAvailableRooms(hotelId, {
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guestsCount,
      roomType: roomType as string,
      maxPrice: parsedMaxPrice,
      features: parsedFeatures,
      page: parsedPage,
      limit: parsedLimit,
    });
    console.log("Available rooms: ", result);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching available rooms:", error);
    res.status(500).json({
      error: "Error fetching available rooms",
      details: error instanceof Error ? error.message : undefined,
    });
  }
};
