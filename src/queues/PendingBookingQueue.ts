import { Queue, Worker, Job } from "bullmq";
import IORedis, { Redis, RedisOptions } from "ioredis";
import dotenv from "dotenv";
import prisma from "@/config/database";
import { BookingStatus, RoomStatus, PaymentStatus } from "@prisma/client";
import NotificationService from "@/services/notificationService";
import { RedisUrl } from "@/config";

// Load environment variables
dotenv.config();
const notificationService = new NotificationService();

// Validate Redis URL
if (!RedisUrl) {
  throw new Error("UPSTASH_REDIS_REST_URL is required");
}

// Singleton instances
let connection: Redis | null = null;
let cancellationQueue: Queue | null = null;
let cancellationWorker: Worker | null = null;
let isProcessingJob = false;

// Shared Redis config for both BullMQ and general use
const getSharedRedisConfig = (url: string): RedisOptions => {
  const parsedUrl = new URL(url);
  const config: RedisOptions = {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port) || 6379,
    username: parsedUrl.username || "default",
    password: process.env.REDIS_PASSWORD || parsedUrl.password,
    connectTimeout: 30000, // Increased to 30 seconds
    commandTimeout: 120000, // Increased to 2 minutes
    maxRetriesPerRequest: null, // Required by BullMQ
    enableAutoPipelining: false,
    enableOfflineQueue: true,
    retryStrategy: (times: number) => {
      if (times > 2) return null;
      return Math.min(times * 2000, 5000);
    },
    reconnectOnError: (err) => {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        // Only reconnect in case of READONLY error
        return true;
      }
      return false;
    },
    lazyConnect: true, // Only connect when needed
    disconnectTimeout: 20000, // Wait 20s before marking connection as disconnected
    keepAlive: 30000, // Send keepalive packet every 30 seconds
    noDelay: true, // Disable Nagle's algorithm
  };

  if (parsedUrl.protocol === "rediss:") {
    config.tls = {
      rejectUnauthorized: false,
      servername: parsedUrl.hostname,
    };
  }

  return config;
};

// Safe cleanup function
const cleanup = async () => {
  console.log("🧹 Starting cleanup process...");
  isProcessingJob = false;

  try {
    if (cancellationWorker) {
      console.log("Closing worker...");
      await cancellationWorker.close();
      cancellationWorker = null;
    }

    if (cancellationQueue) {
      console.log("Closing queue...");
      await cancellationQueue.close();
      cancellationQueue = null;
    }

    if (connection) {
      console.log("Closing Redis connection...");
      if (connection.status === "ready") {
        await connection.quit();
      } else {
        connection.disconnect();
      }
      connection = null;
    }

    console.log("✅ Cleanup complete");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
};

// Add this at the top with other constants
const getDynamicDelay = (): number => {
  const currentHour = new Date().getHours();
  // Night time (10 PM - 9 AM): Check every hour
  if (currentHour >= 22 || currentHour < 9) {
    return 3600000; // 1 hour
  }
  // Day time: Check every 12 minutes
  return 720000; // 12 minutes
};

// Initialize the queue system
const initializeQueueSystem = async () => {
  if (cancellationQueue && cancellationWorker) {
    console.log("⚠️ Queue system already initialized, skipping...");
    return;
  }

  await cleanup();

  console.log("🚀 Initializing Booking Queue System...");

  try {
    // Create shared Redis connection
    connection = new IORedis(getSharedRedisConfig(RedisUrl!));

    // Set up connection event handlers
    connection.on("connect", () =>
      console.log("✅ Redis connection established")
    );
    connection.on("ready", () => console.log("✅ Redis connection ready"));
    connection.on("error", (error) =>
      console.error("❌ Redis connection error:", error)
    );
    connection.on("close", () => console.log("⚠️ Redis connection closed"));

    // Wait for connection to be ready with timeout
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Redis connection timeout"));
        }, 15000);

        connection!
          .ping()
          .then(() => {
            clearTimeout(timeoutId);
            console.log("✅ Redis PING successful");
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            console.error("❌ Redis PING failed:", error);
            reject(error);
          });
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Initial connection timeout")), 20000)
      ),
    ]);

    // Create queue with shared connection
    cancellationQueue = new Queue("cancellationQueue", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 3600 }, // Keep completed jobs for 1hr
        removeOnFail: { age: 7200 }, // Keep failed jobs for 2hrs
      },
    });

    // Create worker with shared connection and more conservative settings
    cancellationWorker = new Worker(
      "cancellationQueue",
      async (job: Job) => {
        const { bookingId } = job.data;
        console.log(
          `🔄 Processing cancellation job for booking ID: ${bookingId}`
        );

        isProcessingJob = true;
        try {
          // Fetch booking details
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
              room: true,
              payment: true,
              hotel: { include: { managers: true } },
              customer: true,
            },
          });

          if (!booking) {
            console.log(`⚠️ Booking with ID ${bookingId} not found.`);
            return;
          }

          if (booking.status !== BookingStatus.PENDING) {
            console.log(
              `ℹ️ Booking ID ${bookingId} is no longer pending (current status: ${booking.status}).`
            );
            return;
          }

          console.log(
            `🔄 Starting auto-cancellation process for booking ID: ${bookingId}`
          );

          // Start a transaction to ensure atomicity
          await prisma.$transaction(async (tx) => {
            await tx.booking.update({
              where: { id: bookingId },
              data: { status: BookingStatus.CANCELLED },
            });
            await tx.room.update({
              where: { id: booking.roomId },
              data: { roomStatus: RoomStatus.AVAILABLE },
            });
            if (booking.payment) {
              await tx.payment.update({
                where: { id: booking.payment.id },
                data: { status: PaymentStatus.FAILED },
              });
            }
          });

          console.log(`📱 Sending cancellation notifications`);
          await notificationService.sendBookingCancelNotification(bookingId);

          console.log(
            `✅ Auto-cancellation completed for booking ID ${bookingId}`
          );
        } catch (error) {
          console.error(
            `❌ Failed to auto-cancel booking ID ${bookingId}:`,
            error
          );
          throw error;
        } finally {
          isProcessingJob = false;
        }
      },
      {
        connection,
        concurrency: 1,
        lockDuration: 30000,
        maxStalledCount: 1,
        stalledInterval: 45000, // Increased to 45 seconds
        drainDelay: getDynamicDelay(),
      }
    );

    // Worker event handlers with improved error handling
    cancellationWorker.on("failed", (job, err) => {
      console.error(
        `❌ Job failed for booking ID ${job?.data.bookingId}:`,
        err
      );
      isProcessingJob = false;
    });

    cancellationWorker.on("completed", (job) => {
      console.log(`✅ Job completed for booking ID: ${job.data.bookingId}`);
      isProcessingJob = false;
    });

    cancellationWorker.on("error", (err) => {
      // Only log timeout errors at debug level to reduce noise
      if (err.message.includes("timed out")) {
        console.debug(
          "ℹ️ Redis command timed out (expected during idle periods)"
        );
      } else {
        console.error("❌ Worker error:", err);
      }
    });

    cancellationWorker.on("ready", () => console.log("✅ Worker is ready"));

    cancellationWorker.on("drained", () => {
      const delay = getDynamicDelay();
      const minutes = delay / 1000 / 60;
      console.log(
        `ℹ️ Queue is empty, worker waiting for new jobs... Next check in ${minutes} minutes`
      );
    });

    console.log("✅ Queue system initialized");
  } catch (error) {
    console.error("❌ Failed to initialize queue system:", error);
    await cleanup();
    throw error;
  }
};

// Handle graceful shutdown
const handleShutdown = async () => {
  console.log("📥 Gracefully shutting down queue system...");
  await cleanup();
  process.exit(0);
};

// Handle SIGTERM and SIGINT
process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);

// Initialize on startup
initializeQueueSystem().catch((error) => {
  console.error("Failed to initialize queue system:", error);
  process.exit(1);
});

// Export only the queue for other modules to use
export const getCancellationQueue = () => {
  if (!cancellationQueue) {
    throw new Error("Queue system not initialized");
  }
  return cancellationQueue;
};
