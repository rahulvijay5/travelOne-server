import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { clerkClient } from "@clerk/express";

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
    console.log("Query: ", query);
    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Search query is required" });
      return;
    }
    const users = await userService.searchUsers(query);
    console.log("Users: ", users);
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Error searching users" });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Error fetching user details" });
  }
};

export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { role, clerkId } = req.body;
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role,
      },
    });
    const updateUserRole = await userService.updateUserRole(clerkId, role);
    console.log(updateUserRole)
    if (!updateUserRole) {
      res.status(400).json({ error: "Error updating user role" });
      return;
    }else{
      res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Error updating user role" });
  }
};
