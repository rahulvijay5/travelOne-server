import prisma from '../config/database';
import { Role, User } from '@prisma/client';

interface CreateUserData {
  phoneNumber: string;
  email: string;
  name: string;
  clerkId: string;
  role?: Role;
}

export class UserService {
  async createUser(userData: CreateUserData): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: userData.phoneNumber }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    return prisma.user.create({
      data: {
        ...userData,
        role: userData.role || 'CUSTOMER'
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

  async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { clerkId: userId }
    });
  }

  async updateUserRole(clerkId:string,role:Role):Promise<boolean>{
    const user = await prisma.user.update({
      where:{
        clerkId
      },
      data:{
        role
      }
    })
    if(!user){
      throw new Error("User not found")
    }
    return true
  }
} 