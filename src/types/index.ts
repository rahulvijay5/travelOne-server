import { BookingStatus, Role } from "@prisma/client";

import { PaymentStatus } from "@prisma/client";

// Hotel
export interface CreateHotelData {
  hotelName: string;
  description: string;
  location: string;
  address: string;
  totalRooms: number;
  code: string;
  contactNumber: string;
  amenities: string[];
  hotelImages: string[];
  owner: string;
}

export interface UpdateHotelData {
  hotelName?: string;
  description?: string;
  location?: string;
  address?: string;
  totalRooms?: number;
  contactNumber?: string;
  amenities?: string[];
  hotelImages?: string[];
}

export interface HotelRulesData {
  petsAllowed: boolean;
  maxPeopleInOneRoom: number;
  extraMattressOnAvailability: boolean;
  parking: boolean;
  swimmingPool: boolean;
  swimmingPoolTimings: string | null;
  ownRestaurant: boolean;
  checkInTime: string;
  checkOutTime: string;
  guestInfoNeeded: boolean;
  smokingAllowed: boolean;
  alcoholAllowed: boolean;
  eventsAllowed: boolean;
  minimumAgeForCheckIn: number;
}

// Booking
export interface CreateBookingData {
  hotelId: string;
  roomId: string;
  customerId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  payment?: {
    totalAmount: number;
    paidAmount: number;
    status?: PaymentStatus;
    transactionId?: string;
  };
}

export interface UpdateBookingData {
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
  status?: BookingStatus;
}

export interface UpdatePaymentData {
  status: PaymentStatus;
  paidAmount?: number;
  transactionId?: string;
}

//Room
export interface CreateRoomData {
  hotelId: string;
  name: string;
  type: string;
  price: number;
  maxOccupancy: number;
  features: string[];
  images: string[];
}

export interface UpdateRoomData {
  name?: string;
  type?: string;
  price?: number;
  maxOccupancy?: number;
  features?: string[];
  images?: string[];
}

//User
export interface CreateUserData {
  phoneNumber: string;
  email: string;
  name: string;
  clerkId: string;
  role?: Role;
}
