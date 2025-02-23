import { Booking, BookingStatus, Role, RoomStatus } from "@prisma/client";

import { PaymentStatus } from "@prisma/client";

export type Timeframe = 'today' | 'tomorrow' | 'thisWeek' | 'currentMonth';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Hotel
export interface CreateHotelData {
  hotelName: string;
  description: string;
  location: string;
  address: string;
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
  checkInTime: number;
  checkOutTime: number;
  guestInfoNeeded: boolean;
  smokingAllowed: boolean;
  alcoholAllowed: boolean;
  eventsAllowed: boolean;
  minimumAgeForCheckIn: number;
}

export enum BookingCreatedBy {
  MANAGER = "MANAGER",
  CUSTOMER = "CUSTOMER",
}

// Booking
export interface CreateBookingData {
  hotelId: string;
  roomId: string;
  customerId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  status?: BookingStatus;
  payment?: {
    totalAmount: number;
    paidAmount: number;
    status?: PaymentStatus;
    transactionId?: string;
  };
  createdBy: BookingCreatedBy;
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
  roomNumber: string;
  type: string;
  price: number;
  maxOccupancy: number;
  features: string[];
  images: string[];
}

export interface CreateRooms {
  hotelId: string;
  rooms: CreateRoomData[];
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


export interface FilteredBookingResponse {
  data: {
    id: string;
    status: BookingStatus;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    room: {
      roomNumber: string;
    };
    customer: {
      name: string;
    };
    payment:{
      totalAmount: number;
    } | null;
  }[];
  pagination: {
    total: number;
    pages: number;
    currentPage: number;
    limit: number;
  };
}

export interface BookingFilters {
  status?: BookingStatus;
  timeRange?: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';
  startDate?: Date;
  endDate?: Date;
  roomStatus?: RoomStatus;
  sortBy?: 'checkIn' | 'checkOut' | 'bookingTime';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export enum BookingNotificationType {
  CREATED = 'created',
  UPDATED = 'updated',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export interface BookingNotificationData {
  bookingId: string;
  type: BookingNotificationType;
}

export interface CheckBookingStatusResponse {
  id: string;
  status: BookingStatus;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  payment:{
    paidAmount: number;
    totalAmount: number;
    status: PaymentStatus;
  } | null;
  room: {
    roomNumber: string;
    type: string;
  } | null;
}