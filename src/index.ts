import express, { Express } from "express";
import cors from 'cors';
import dotenv from "dotenv";
import swaggerUi from 'swagger-ui-express';
import { clerkMiddleware } from "@clerk/express";

import { specs } from './config/swagger';
import { initializeScheduler } from './config/scheduler';

// Import routes
import userRoutes from './routes/userRoutes';
import roomRoutes from './routes/roomRoutes';
import imageRoutes from './routes/imageRoutes';
import hotelRoutes from './routes/hotelRoutes';
import bookingRoutes from './routes/bookingRoutes';
import documentRoutes from './routes/documentRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { getCancellationQueue } from "./queues/PendingBookingQueue";
dotenv.config();
const app: Express = express();
import {PORT} from './config';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(clerkMiddleware());

// Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

app.get("/status",(req,res)=>{
  res.json({message:"Server is working completely fine. GO ahead!"})
})

initializeScheduler();

const shutdown = async () => {
  console.log("Shutting down gracefully...");
  await getCancellationQueue().close();
  process.exit(0);
};

process.on('SIGINT', () => {
  console.log('Received SIGINT. Initiating shutdown...');
  shutdown();
});
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Initiating shutdown...');
  shutdown();
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/docs`);
});