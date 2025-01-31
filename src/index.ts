import express, { Express } from "express";
import cors from 'cors';
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

// Import routes
import userRoutes from './routes/userRoutes';
import hotelRoutes from './routes/hotelRoutes';
import roomRoutes from './routes/roomRoutes';
import bookingRoutes from './routes/bookingRoutes';
import imageRoutes from './routes/imageRoutes';

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Swagger Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/images', imageRoutes);

app.get("/status",(req,res)=>{
  res.json({message:"Server is working completely fine. GO ahead!"})
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/docs`);
});