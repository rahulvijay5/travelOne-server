import { Request, Response } from "express";
import { HotelService } from "../services/hotelService";
import { clerkClient } from "@clerk/express";

const hotelService = new HotelService();

export const createHotel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const hotelData = req.body;
    const hotel = await hotelService.createHotel(hotelData);
    res.status(201).json(hotel);
  } catch (error) {
    console.error("Error creating hotel:", error);
    res.status(500).json({ error: "Error creating hotel" });
  }
};

export const getHotelById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = await hotelService.getHotelById(hotelId);
    
    if (!hotel) {
      res.status(404).json({ error: "Hotel not found" });
      return;
    }

    res.json(hotel);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({ error: "Error fetching hotel" });
  }
};

export const getHotelsByOwnerId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ownerId } = req.params;
    const hotel = await hotelService.getHotelsByOwnerId(ownerId);
    
    if (!hotel) {
      res.status(404).json({ error: "Hotels not found" });
      return;
    }

    res.json(hotel);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ error: "Error fetching hotels" });
  }
};

export const updateHotel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const updateData = req.body;
    const hotel = await hotelService.updateHotel(hotelId, updateData);
    
    if (!hotel) {
      res.status(404).json({ error: "Hotel not found" });
      return;
    }

    res.json(hotel);
  } catch (error) {
    console.error("Error updating hotel:", error);
    res.status(500).json({ error: "Error updating hotel" });
  }
};

export const deleteHotel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    await hotelService.deleteHotel(hotelId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting hotel:", error);
    res.status(500).json({ error: "Error deleting hotel" });
  }
};

export const getAllHotels = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const hotels = await hotelService.getAllHotels();
    res.json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res.status(500).json({ error: "Error fetching hotels" });
  }
};

export const searchHotels = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Search query is required" });
      return;
    }
    const hotels = await hotelService.searchHotels(query);
    res.json(hotels);
  } catch (error) {
    console.error("Error searching hotels:", error);
    res.status(500).json({ error: "Error searching hotels" });
  }
};

export const getHotelByCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Hotel code is required" });
      return;
    }

    const hotel = await hotelService.getHotelByCode(code);
    if (!hotel) {
      res.status(404).json({ error: "Hotel not found" });
      return;
    }

    res.json(hotel);
  } catch (error) {
    console.error("Error fetching hotel:", error);
    res.status(500).json({ error: "Error fetching hotel" });
  }
};

export const addManager = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const { managerId } = req.body;
    const { hotel, clerkId } = await hotelService.addManager(hotelId, managerId);

    // Update role in Clerk
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: 'MANAGER',
      },
    });

    res.json(hotel);
  } catch (error) {
    console.error("Error adding manager:", error);
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: "User not found" });
      } else if (error.message === 'User is already a manager or owner') {
        res.status(400).json({ error: "User is already a manager or owner" });
      } else {
        res.status(500).json({ error: "Error adding manager to hotel" });
      }
    } else {
      res.status(500).json({ error: "Error adding manager to hotel" });
    }
  }
};

export const removeManager = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId, managerId } = req.params;
    const { hotel, clerkId } = await hotelService.removeManager(hotelId, managerId);

    // Update role in Clerk if the user's role was changed back to CUSTOMER
    if (clerkId) {
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          role: 'CUSTOMER',
        },
      });
    }

    res.json(hotel);
  } catch (error) {
    console.error("Error removing manager:", error);
    res.status(500).json({ error: "Error removing manager from hotel" });
  }
};

export const getAllManagersOfHotel = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const hotel = await hotelService.getAllManagersOfHotel(hotelId);
    res.json(hotel);
  } catch (error) {
    console.error("Error removing manager:", error);
    res.status(500).json({ error: "Error removing manager from hotel" });
  }
};

export const updateHotelRules = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { hotelId } = req.params;
    const rulesData = req.body;
    const rules = await hotelService.updateHotelRules(hotelId, rulesData);
    res.json(rules);
  } catch (error) {
    console.error("Error updating hotel rules:", error);
    res.status(500).json({ error: "Error updating hotel rules" });
  }
}; 