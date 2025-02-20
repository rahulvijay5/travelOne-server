import { CreateHotelData, HotelRulesData, UpdateHotelData } from "@/types";
import prisma from "../config/database";
import { Hotel, HotelRules, User } from "@prisma/client";

export class HotelService {
  async generateRandomCode() {
    const characters = "abcdefghijklmnopqrstuvwxyz";
    let randomCode = "";
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomCode += characters[randomIndex];
    }
    return randomCode;
  }

  async checkIfHotelCodeExists(code: string): Promise<boolean> {
    const existingHotel = await prisma.hotel.findUnique({
      where: { code: code },
    });
    return existingHotel ? true : false;
  }

  async getNonExistingRandomCode(): Promise<string> {
    let randomCode = await this.generateRandomCode();
    while (true) {
      const hotelExists = await this.checkIfHotelCodeExists(randomCode);
      if (!hotelExists) {
        return randomCode;
      }
      randomCode = await this.generateRandomCode();
    }
  }

  async createHotel(data: CreateHotelData): Promise<Hotel> {
    const randomCode = await this.getNonExistingRandomCode();
    return prisma.hotel.create({
      data: {
        ...data,
        code: randomCode,
        owner: {
          connect: { id: data.owner },
        },
        managers: {
          connect: { id: data.owner },
        },
      },
      include: {
        owner: true,
        managers: false,
        rules: false,
      },
    });
  }

  async getHotelById(hotelId: string): Promise<Hotel | null> {
    return prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        owner: true,
        managers: true,
        rules: true,
        rooms: true,
      },
    });
  }

  async getHotelsByOwnerId(ownerId: string): Promise<Hotel[] | null> {
    const hotels = await prisma.user.findUnique({
      where: { id: ownerId },
      include: {
        ownedHotels: true,
      },
    });
    if (!hotels) {
      return null;
    }
    console.log("Hotels fetched with ownedHotels ");
    return hotels.ownedHotels;
  }

  async updateHotel(hotelId: string, data: UpdateHotelData): Promise<Hotel> {
    return prisma.hotel.update({
      where: { id: hotelId },
      data,
      include: {
        owner: true,
        managers: true,
        rules: true,
      },
    });
  }

  async deleteHotel(hotelId: string): Promise<void> {
    await prisma.hotel.delete({
      where: { id: hotelId },
    });
  }

  async getAllHotels(): Promise<Hotel[]> {
    return prisma.hotel.findMany({
      include: {
        owner: true,
        managers: true,
        rules: true,
      },
    });
  }

  async searchHotels(query: string): Promise<Hotel[]> {
    return prisma.hotel.findMany({
      where: {
        OR: [
          { hotelName: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        owner: true,
        managers: true,
        rules: true,
      },
    });
  }

  async getHotelByCode(code: string): Promise<Hotel | null> {
    return prisma.hotel.findUnique({
      where: { code },
      include: {
        managers: {
          select: {
            name: true,
            // email: true,
          }
        },
        rules: true,
        // rooms:{
        //   select: {
        //     id: true,
        //     type: true,
        //     images: true,
        //     price: true,
        //     maxOccupancy: true,
        //     features: true,
        //     roomNumber: true,
        //   }
        // }
      }
    });
  }

  async addManager(hotelId: string, managerId: string): Promise<{ hotel: Hotel; clerkId: string }> {
    // Check user's current role
    const user = await prisma.user.findUnique({
      where: { id: managerId },
      include: {
        managedHotels: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'MANAGER' || user.role === 'OWNER') {
      throw new Error('User is already a manager or owner');
    }

    // Update user's role to MANAGER and add them to hotel
    await prisma.user.update({
      where: { id: managerId },
      data: { role: 'MANAGER' }
    });

    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        managers: {
          connect: { id: managerId },
        },
      },
      include: {
        owner: true,
        managers: true,
      },
    });

    return { hotel: updatedHotel, clerkId: user.clerkId };
  }

  async getAllManagersOfHotel(hotelId: string): Promise<User[]> {
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        managers: true,
      },
    });
    if (!hotel) {
      return [];
    }
    return hotel.managers;
  }

  async removeManager(hotelId: string, managerId: string): Promise<{ hotel: Hotel; clerkId: string | null }> {
    // First remove the manager from the hotel
    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: {
        managers: {
          disconnect: { id: managerId },
        },
      },
      include: {
        owner: true,
        managers: true,
      },
    });

    // Check if the user manages any other hotels
    const user = await prisma.user.findUnique({
      where: { id: managerId },
      include: {
        managedHotels: true
      }
    });

    if (user && user.managedHotels.length === 0) {
      // If they don't manage any other hotels, change role back to CUSTOMER
      await prisma.user.update({
        where: { id: managerId },
        data: { role: 'CUSTOMER' }
      });
      return { hotel: updatedHotel, clerkId: user.clerkId };
    }

    return { hotel: updatedHotel, clerkId: null };
  }

  async updateHotelRules(
    hotelId: string,
    rulesData: Partial<HotelRulesData>
  ): Promise<HotelRules> {
    const existingRules = await prisma.hotelRules.findUnique({
      where: { hotelId },
    });

    if (existingRules) {
      return prisma.hotelRules.update({
        where: { hotelId },
        data: rulesData,
      });
    } else {
      return prisma.hotelRules.create({
        data: {
          ...rulesData,
          hotelId,
          petsAllowed: rulesData.petsAllowed ?? false,
          maxPeopleInOneRoom: rulesData.maxPeopleInOneRoom ?? 2,
          extraMattressOnAvailability:
            rulesData.extraMattressOnAvailability ?? false,
          parking: rulesData.parking ?? false,
          swimmingPool: rulesData.swimmingPool ?? false,
          ownRestaurant: rulesData.ownRestaurant ?? false,
          checkInTime: rulesData.checkInTime ?? 660,
          checkOutTime: rulesData.checkOutTime ?? 600,
          guestInfoNeeded: rulesData.guestInfoNeeded ?? true,
          smokingAllowed: rulesData.smokingAllowed ?? false,
          alcoholAllowed: rulesData.alcoholAllowed ?? false,
          eventsAllowed: rulesData.eventsAllowed ?? false,
          minimumAgeForCheckIn: rulesData.minimumAgeForCheckIn ?? 18,
        },
      });
    }
  }
}
