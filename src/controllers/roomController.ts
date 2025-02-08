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
      ...result
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
    const rooms = await roomService.getHotelRoomsByStatus(hotelId, roomStatus as RoomStatus);
    
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

    const room = await roomService.updateRoomStatus(roomId, roomStatus as RoomStatus);
    
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