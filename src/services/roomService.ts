import prisma from "../config/database";
import { Room, RoomStatus, BookingStatus } from "@prisma/client";
import { CreateRoomData, CreateRooms, UpdateRoomData } from "@/types";
import { imageService } from "./imageService";

export class RoomService {
  async createRoom(data: CreateRoomData): Promise<Room> {
    const { hotelId, ...roomData } = data;
    return prisma.room.create({
      data: {
        ...roomData,
        hotel: {
          connect: { id: hotelId },
        },
      },
      include: {
        hotel: true,
      },
    });
  }

  async createMultipleRooms(
    data: CreateRooms
  ): Promise<{ count: number; rooms: Room[] }> {
    const { hotelId, rooms } = data;

    // First create all rooms using createMany for efficiency
    await prisma.room.createMany({
      data: rooms.map((room) => ({
        ...room,
        hotelId,
      })),
    });

    // Then fetch all created rooms with their relations
    const createdRooms = await prisma.room.findMany({
      where: {
        hotelId,
        roomNumber: {
          in: rooms.map((room) => room.roomNumber),
        },
      },
      orderBy: {
        roomNumber: "asc",
      },
    });

    return {
      count: createdRooms.length,
      rooms: createdRooms,
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
        hotel: true,
      },
    });
  }

  async deleteRoom(roomId: string): Promise<void> {
    // First get the room to access its images
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        images: true,
      },
    });

    if (room && room.images.length > 0) {
      // Delete all images from Cloudflare
      await imageService.deleteImages(room.images);
    }

    // Then delete the room from database
    await prisma.room.delete({
      where: { id: roomId },
    });
  }

  async getHotelRooms(
    hotelId: string
  ): Promise<{ id: string; type: string; roomNumber: string }[] | null> {
    const rooms = await prisma.room.findMany({
      where: { hotelId },
      select: {
        id: true,
        type: true,
        roomNumber: true,
      },
    });
    console.log(rooms);
    return rooms;
  }

  async getHotelRoomsByStatus(
    hotelId: string,
    roomStatus: RoomStatus
  ): Promise<Room[]> {
    return prisma.room.findMany({
      where: { hotelId, roomStatus },
    });
  }

  async updateRoomStatus(
    roomId: string,
    roomStatus: RoomStatus
  ): Promise<Room> {
    return prisma.room.update({
      where: { id: roomId },
      data: { roomStatus },
    });
  }

  async getAvailableRooms(
    hotelId: string,
    params: {
      checkIn: Date;
      checkOut: Date;
      guests: number;
      roomType?: string;
      maxPrice?: number;
      features?: string[];
      page?: number;
      limit?: number;
    }
  ): Promise<{
    availableRooms: Room[];
    totalRooms: number;
    priceRange: { min: number; max: number };
    pagination: {
      currentPage: number;
      totalPages: number;
      limit: number;
    };
  }> {
    const {
      checkIn,
      checkOut,
      guests,
      roomType,
      maxPrice,
      features,
      page = 1,
      limit = 10,
    } = params;

    // Get all rooms that might be available (base criteria)
    const whereClause: any = {
      hotelId,
      maxOccupancy: {
        gte: guests,
      },
      ...(roomType && { type: roomType }),
      ...(maxPrice && { price: { lte: maxPrice } }),
      ...(features &&
        features.length > 0 && {
          features: {
            hasEvery: features,
          },
        }),
    };

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Find rooms that have no bookings or no conflicting bookings for the given dates
    const [rooms, totalCount] = await Promise.all([
      prisma.room.findMany({
        where: {
          AND: [
            whereClause,
            {
              OR: [
                {
                  bookings: {
                    none: {
                      AND: [
                        // Check if there are any bookings that overlap with requested dates
                        {
                          checkIn: { lt: checkOut },
                          checkOut: { gt: checkIn },
                        },
                        // And are in a blocking status (CONFIRMED or PENDING)
                        {
                          status: {
                            in: [
                              BookingStatus.CONFIRMED,
                              BookingStatus.PENDING,
                            ],
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  bookings: {
                    every: {
                      OR: [
                        // Room is available if:
                        // 1. Existing booking's check-out is before or equal to new check-in
                        {
                          AND: [
                            { checkOut: { lte: checkIn } },
                            {
                              status: {
                                in: [
                                  BookingStatus.COMPLETED,
                                  BookingStatus.CONFIRMED,
                                ],
                              },
                            },
                          ],
                        },
                        // 2. Existing booking's check-in is after or equal to new check-out
                        {
                          AND: [
                            { checkIn: { gte: checkOut } },
                            {
                              status: {
                                in: [
                                  BookingStatus.COMPLETED,
                                  BookingStatus.CONFIRMED,
                                ],
                              },
                            },
                          ],
                        },
                        // 3. Booking is cancelled
                        {
                          status: BookingStatus.CANCELLED,
                        },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
        // include: {
        //   hotel: {
        //     select: {
        //       hotelName: true,
        //       address: true,
        //       rules: {
        //         select: {
        //           checkInTime: true,
        //           checkOutTime: true
        //         }
        //       }
        //     }
        //   }
        // },
        orderBy: {
          price: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.room.count({
        where: whereClause,
      }),
    ]);

    // Calculate price range
    const priceRange = rooms.reduce(
      (acc, room) => ({
        min: Math.min(acc.min, room.price),
        max: Math.max(acc.max, room.price),
      }),
      { min: Infinity, max: -Infinity }
    );

    // If no rooms found, set price range to 0
    if (rooms.length === 0) {
      priceRange.min = 0;
      priceRange.max = 0;
    }

    return {
      availableRooms: rooms,
      totalRooms: totalCount,
      priceRange,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        limit,
      },
    };
  }
}
