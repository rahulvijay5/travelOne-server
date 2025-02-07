import { CreateUserData } from '@/types';
import prisma from '../config/database';
import { Hotel, Role, User } from '@prisma/client';

export class UserService {
  async createUser(userData: CreateUserData): Promise<User> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: userData.phoneNumber },
          { email: userData.email },
          { clerkId: userData.clerkId }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    return prisma.user.create({
      data: {
        ...userData,
        role: userData.role || Role.CUSTOMER
      }
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phoneNumber: { contains: query } }
        ]
      }
    });
  }

  async getUserByClerkId(clerkId: string): Promise<User | null> {
    console.log("FInding user in db by clerkId: ", clerkId);
    const user = await prisma.user.findUnique({
      where: { clerkId:clerkId }
    });
    console.log("User found: ", user);
    return user;
  }

  async updateUserRole(clerkId: string, role: Role): Promise<User> {
    return prisma.user.update({
      where: { clerkId: clerkId },
      data: { role }
    });
  }

  async getCurrentManagingHotel(userId: string): Promise<Hotel | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { managedHotels: true }
    });
    return user?.managedHotels[0] || null;
  }
} 