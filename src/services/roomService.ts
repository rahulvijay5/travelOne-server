import prisma from '../config/database';
import { Room, RoomStatus } from '@prisma/client';
import { CreateRoomData, CreateRooms, UpdateRoomData } from '@/types';
import { imageService } from './imageService';

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

  async createMultipleRooms(data: CreateRooms): Promise<{ count: number; rooms: Room[] }> {
    const { hotelId, rooms } = data;

    // First create all rooms using createMany for efficiency
    await prisma.room.createMany({
      data: rooms.map((room) => ({
        ...room,
        hotelId
      }))
    });

    // Then fetch all created rooms with their relations
    const createdRooms = await prisma.room.findMany({
      where: {
        hotelId,
        roomNumber: {
          in: rooms.map(room => room.roomNumber)
        }
      },
      orderBy: {
        roomNumber: 'asc'
      }
    });

    return {
      count: createdRooms.length,
      rooms: createdRooms
    };
  }

  async getRoomById(roomId: string): Promise<Room | null> {
    return prisma.room.findUnique({
      where: { id: roomId },
      // include: {
      //   hotel: true,
      //   bookings: {
      //     include: {
      //       customer: true,
      //       payment: true
      //     }
      //   }
      // }
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
    // First get the room to access its images
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        images: true
      }
    });

    if (room && room.images.length > 0) {
      // Delete all images from Cloudflare
      await imageService.deleteImages(room.images);
    }

    // Then delete the room from database
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