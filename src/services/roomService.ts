import prisma from '../config/database';
import { Room } from '@prisma/client';

interface CreateRoomData {
  hotelId: string;
  name: string;
  type: string;
  price: number;
  maxOccupancy: number;
  features: string[];
  images: string[];
}

interface UpdateRoomData {
  name?: string;
  type?: string;
  price?: number;
  maxOccupancy?: number;
  features?: string[];
  images?: string[];
}

export class RoomService {
  async createRoom(data: CreateRoomData): Promise<Room> {
    const { hotelId, ...roomData } = data;
    return prisma.room.create({
      data: {
        ...roomData,
        hotel: {
          connect: { id: hotelId }
        }
      },
      include: {
        hotel: true
      }
    });
  }

  async getRoomById(roomId: string): Promise<Room | null> {
    return prisma.room.findUnique({
      where: { id: roomId },
      include: {
        hotel: true,
        bookings: {
          include: {
            customer: true,
            payment: true
          }
        }
      }
    });
  }

  async updateRoom(roomId: string, data: UpdateRoomData): Promise<Room> {
    return prisma.room.update({
      where: { id: roomId },
      data,
      include: {
        hotel: true
      }
    });
  }

  async deleteRoom(roomId: string): Promise<void> {
    await prisma.room.delete({
      where: { id: roomId }
    });
  }

  async getHotelRooms(hotelId: string): Promise<Room[]> {
    return prisma.room.findMany({
      where: { hotelId },
      include: {
        bookings: {
          include: {
            customer: true,
            payment: true
          }
        }
      }
    });
  }

  async updateRoomAvailability(roomId: string, available: boolean): Promise<Room> {
    return prisma.room.update({
      where: { id: roomId },
      data: { available }
    });
  }
} 