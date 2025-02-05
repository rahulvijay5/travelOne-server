import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { clerkClient } from "@clerk/express";
import { Role } from "@prisma/client";

const userService = new UserService();

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { phoneNumber, email, name, clerkId, role } = req.body;
    const user = await userService.createUser({
      phoneNumber,
      email,
      name,
      clerkId,
      role,
    });
    console.log("New user created: ", user);
    res.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error && error.message === "User already exists") {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Error creating user" });
    }
  }
};

export const searchUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Search query is required" });
      return;
    }
    const users = await userService.searchUsers(query);

    if (users.length === 0) {
      res.status(404).json({ error: "No users found" });
      return;
    }
    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Error searching users" });
  }
};

export const getUserByClerkId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { clerkId } = req.params;
    const user = await userService.getUserByClerkId(clerkId);

    console.log("User found: ", user);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { role, clerkId } = req.body;
    
    // Update role in Clerk
    try {
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          role,
        },
      });
    } catch (clerkError) {
      console.error("Error updating Clerk metadata:", clerkError);
      res.status(400).json({ error: "Error updating Clerk user metadata" });
      return;
    }

    // Update role in our database
    const updatedUser = await userService.updateUserRole(clerkId, role);
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Error updating user role" });
  }
};
