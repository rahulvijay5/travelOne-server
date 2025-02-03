import prisma from '../config/database';
import { Room, RoomStatus } from '@prisma/client';
import { CreateRoomData, UpdateRoomData } from '@/types';

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
      // include: {
      //   bookings: {
      //     include: {
      //       customer: true,
      //       payment: true
      //     }
      //   }
      // }
    });
  }

  async getHotelRoomsByStatus(hotelId: string, roomStatus: RoomStatus): Promise<Room[]> {
    return prisma.room.findMany({
      where: { hotelId, roomStatus }
    });
  }

  async updateRoomStatus(roomId: string, roomStatus: RoomStatus): Promise<Room> {
    return prisma.room.update({
      where: { id: roomId },
      data: { roomStatus }
    });
  }
} 