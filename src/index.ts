import express, { Express } from "express";
import cors from 'cors';
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

// Import routes
import userRoutes from './routes/userRoutes';
import groupRoutes from './routes/groupRoutes';
import todoRoutes from './routes/todoRoutes';

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', todoRoutes); // Note: todo routes include /groups in their paths

app.get("/status",(req,res)=>{
  res.json({message:"Server is working completely fine. GO ahead!"})
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});