import { Request, Response } from "express";
import { RoomService } from "../services/roomService";

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
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ error: "Error deleting room" });
  }
};

export const getHotelRooms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const rooms = await roomService.getHotelRooms(hotelId);
    res.json(rooms);
  } catch (error) {
    console.error("Error fetching hotel rooms:", error);
    res.status(500).json({ error: "Error fetching hotel rooms" });
  }
};

export const updateRoomAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { available } = req.body;
    
    if (typeof available !== 'boolean') {
      res.status(400).json({ error: "Available status must be a boolean" });
      return;
    }

    const room = await roomService.updateRoomAvailability(roomId, available);
    
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.json(room);
  } catch (error) {
    console.error("Error updating room availability:", error);
    res.status(500).json({ error: "Error updating room availability" });
  }
}; 