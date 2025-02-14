import { Queue, Worker, Job } from 'bullmq';
import IORedis, { Redis, RedisOptions } from 'ioredis';
import dotenv from 'dotenv';
import prisma from '@/config/database';
import { BookingStatus, RoomStatus, PaymentStatus } from '@prisma/client';
import NotificationService from '@/services/notificationService';

// Load environment variables
dotenv.config();
const notificationService = new NotificationService();

// Singleton instances
let connection: Redis | null = null;
let bullMQConnection: Redis | null = null;
let cancellationQueue: Queue | null = null;
let cancellationWorker: Worker | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let isProcessingJob = false;

// Validate Redis URL
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
if (!redisUrl) {
  throw new Error('UPSTASH_REDIS_REST_URL is required');
}

console.log('🚀 Initializing Booking Queue System...');

// Parse Redis URL and get base config
const getBaseRedisConfig = (url: string) => {
  try {
    console.log('🔄 Parsing Redis connection URL...');
    const parsedUrl = new URL(url);

    // For Upstash, we always want to use TLS
    if (!parsedUrl.protocol.includes('rediss:')) {
      console.log('⚠️ Converting Redis URL to use TLS (rediss://)');
      url = url.replace('redis://', 'rediss://');
    }

    return {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port) || 6379,
      username: parsedUrl.username || 'default',
      password: process.env.UPSTASH_REDIS_PASSWORD || parsedUrl.password,
      tls: {
        rejectUnauthorized: false,
        servername: parsedUrl.hostname
      },
      connectTimeout: 10000,
      disconnectTimeout: 2000,
      keepAlive: 10000,
      noDelay: true,
      db: 0
    };
  } catch (error) {
    console.error('❌ Failed to parse Redis URL:', error);
    throw new Error('Invalid Redis URL format');
  }
};

// Get config specifically for IORedis client
const getRedisConfig = (url: string): RedisOptions => {
  const baseConfig = getBaseRedisConfig(url);
  return {
    ...baseConfig,
    retryStrategy: (times: number) => {
      if (isProcessingJob) {
        console.log('⚠️ Retry attempted while processing job, preventing retry');
        return null;
      }
      console.log(`⚠️ Redis connection retry attempt ${times}`);
      if (times > 3) {
        console.error('❌ Max retry attempts reached, giving up');
        return null;
      }
      return Math.min(times * 1000, 3000);
    },
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    commandTimeout: 5000
  };
};

// Get config specifically for BullMQ
const getBullMQConfig = (url: string) => {
  const baseConfig = getBaseRedisConfig(url);
  return {
    ...baseConfig,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      console.log(`⚠️ BullMQ Redis connection retry attempt ${times}`);
      if (times > 3) return null;
      return Math.min(times * 1000, 3000);
    }
  };
};

const createRedisConnection = () => {
  if (connection) {
    return connection;
  }

  console.log('🔌 Establishing Redis connection...');
  const redis = new IORedis(getRedisConfig(redisUrl));

  redis.on('connect', () => {
    console.log('✅ Redis connection established successfully');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  redis.on('ready', () => {
    console.log('✅ Redis client ready to receive commands');
    // Test the connection
    redis.ping().then(() => {
      console.log('✅ Redis PING successful');
    }).catch(err => {
      console.error('❌ Redis PING failed:', err);
    });
  });

  redis.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
    if (!reconnectTimer && !isProcessingJob) {
      reconnectTimer = setTimeout(() => {
        console.log('🔄 Attempting to recreate connection...');
        connection?.disconnect();
        connection = null;
        createRedisConnection();
      }, 5000);
    }
  });

  redis.on('close', () => {
    console.log('⚠️ Redis connection closed');
  });

  connection = redis;
  return redis;
};

// Cleanup function
const cleanup = async () => {
  console.log('🧹 Cleaning up Redis connections...');
  isProcessingJob = false;
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Close worker first to stop accepting new jobs
  if (cancellationWorker) {
    await cancellationWorker.close();
    cancellationWorker = null;
  }

  // Close queue next
  if (cancellationQueue) {
    await cancellationQueue.close();
    cancellationQueue = null;
  }

  // Close Redis connections last
  if (connection) {
    await connection.quit();
    connection = null;
  }
  if (bullMQConnection) {
    await bullMQConnection.quit();
    bullMQConnection = null;
  }

  console.log('✅ Cleanup complete');
};

// Initialize the queue system
const initializeQueueSystem = async () => {
  if (cancellationQueue && cancellationWorker) {
    console.log('⚠️ Queue system already initialized, skipping...');
    return;
  }

  console.log('🚀 Initializing Booking Queue System...');

  // Create Redis connections
  connection = createRedisConnection();
  bullMQConnection = new IORedis(getBullMQConfig(redisUrl));

  // Create queue
  cancellationQueue = new Queue('cancellationQueue', {
    connection: bullMQConnection,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: 10
    },
  });

  // Create worker
  cancellationWorker = new Worker(
    'cancellationQueue',
    async (job: Job) => {
      const { bookingId } = job.data;
      console.log(`🔄 Processing cancellation job for booking ID: ${bookingId}`);
      
      isProcessingJob = true;
      try {
        // Fetch the booking details
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            room: true,
            payment: true,
            hotel: {
              include: {
                managers: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        });

        if (!booking) {
          console.log(`⚠️ Booking with ID ${bookingId} not found.`);
          return;
        }

        // Check if the booking is still PENDING
        if (booking.status !== BookingStatus.PENDING) {
          console.log(`ℹ️ Booking ID ${bookingId} is no longer pending (current status: ${booking.status}).`);
          return;
        }

        console.log(`🔄 Starting auto-cancellation process for booking ID: ${bookingId}`);

        // Start a transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
          console.log(`📝 Updating booking status to CANCELLED`);
          // Update booking status to CANCELLED
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: BookingStatus.CANCELLED,
            },
          });

          console.log(`🏨 Updating room ${booking.room.roomNumber} status to AVAILABLE`);
          // Update room status to AVAILABLE
          await tx.room.update({
            where: { id: booking.roomId },
            data: {
              roomStatus: RoomStatus.AVAILABLE,
            },
          });

          // Update payment status to FAILED if payment exists
          if (booking.payment) {
            console.log(`💰 Updating payment status to FAILED`);
            await tx.payment.update({
              where: { id: booking.payment.id },
              data: {
                status: PaymentStatus.FAILED,
              },
            });
          }
        });

        console.log(`📱 Sending cancellation notifications`);
        // Send cancellation notification
        await notificationService.sendBookingCancelNotification(bookingId);

        console.log(`✅ Auto-cancellation completed for booking ID ${bookingId}`);
      } catch (error) {
        console.error(`❌ Failed to auto-cancel booking ID ${bookingId}:`, error);
        throw error; // Let BullMQ handle retries if configured
      } finally {
        isProcessingJob = false;
      }
    },
    { 
      connection: bullMQConnection,
      concurrency: 1,
      lockDuration: 10000,
      maxStalledCount: 1,
    }
  );

  // Set up worker event handlers
  cancellationWorker.on('failed', (job, err) => {
    console.error(`❌ Job failed for booking ID ${job?.data.bookingId}:`, err);
    isProcessingJob = false;
  });

  cancellationWorker.on('completed', (job) => {
    console.log(`✅ Job completed for booking ID: ${job.data.bookingId}`);
    isProcessingJob = false;
  });

  console.log('✅ Queue system initialized');
};

// Handle graceful shutdown
const handleShutdown = async () => {
  console.log('📥 Gracefully shutting down queue system...');
  await cleanup();
  process.exit(0);
};

// Handle both SIGTERM (production) and SIGINT (development)
process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

// Initialize on startup
initializeQueueSystem().catch(error => {
  console.error('Failed to initialize queue system:', error);
  process.exit(1);
});

// Export only the queue for other modules to use
export const getCancellationQueue = () => {
  if (!cancellationQueue) {
    throw new Error('Queue system not initialized');
  }
  return cancellationQueue;
};