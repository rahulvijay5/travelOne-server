import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hotel Management System API',
      version: '1.0.0',
      description: 'API documentation for the Hotel Management System',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Images',
        description: 'Image upload and management endpoints'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            clerkId: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phoneNumber: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'OWNER', 'MANAGER', 'CUSTOMER'] }
          }
        },
        Hotel: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            hotelName: { type: 'string' },
            description: { type: 'string' },
            location: { type: 'string' },
            address: { type: 'string' },
            code: { type: 'string' },
            contactNumber: { type: 'string' },
            amenities: { type: 'array', items: { type: 'string' } },
            hotelImages: { type: 'array', items: { type: 'string' } }
          }
        },
        Room: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            hotelId: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            price: { type: 'number' },
            maxOccupancy: { type: 'integer' },
            available: { type: 'boolean' },
            features: { type: 'array', items: { type: 'string' } },
            images: { type: 'array', items: { type: 'string' } }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            hotelId: { type: 'string' },
            roomId: { type: 'string' },
            customerId: { type: 'string' },
            checkIn: { type: 'string', format: 'date-time' },
            checkOut: { type: 'string', format: 'date-time' },
            guests: { type: 'integer' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            bookingId: { type: 'string' },
            totalAmount: { type: 'number' },
            paidAmount: { type: 'number' },
            status: { type: 'string', enum: ['PENDING', 'PAID', 'REFUNDED', 'FAILED'] },
            transactionId: { type: 'string' }
          }
        },
        BookingAnalytics: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            hotelId: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            totalBookings: { type: 'integer' },
            canceledBookings: { type: 'integer' },
            totalRevenue: { type: 'number' },
            averageRevenue: { type: 'number' },
            occupancyRate: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      }
    }
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const specs = swaggerJsdoc(options); 