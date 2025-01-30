// import { Request, Response } from 'express';
// import prisma from '@/config/database';

// export const getAllGroups = async (req: Request, res: Response) => {
//   try {
//     const groups = await prisma.group.findMany({
//       include: {
//         owner: true,
//         managers: true,
//         members: true,
//         todos: true
//       }
//     });
//     console.log("Groups fetched: ", groups);
//     res.json(groups);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching groups" });
//   }
// };

// export const createGroup = async (req: Request, res: Response) => {
//   try {
//     const { name, ownerId } = req.body;
//     const group = await prisma.group.create({
//       data: {
//         name,
//         ownerId: parseInt(ownerId)
//       },
//       include: {
//         owner: true
//       }
//     });
//     res.json(group);
//     console.log("Group created: ", group);
//   } catch (error) {
//     res.status(500).json({ error: "Error creating group" });
//   }
// };

// export const deleteGroup = async (req: Request, res: Response) => {
//   try {
//     const { groupId } = req.params;
//     await prisma.group.delete({
//       where: { id: parseInt(groupId) }
//     });
//     res.json({ message: "Group deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Error deleting group" });
//   }
// };

// export const addManager = async (req: Request, res: Response) => {
//   try {
//     const { groupId } = req.params;
//     const { managerId } = req.body;
    
//     const group = await prisma.group.update({
//       where: { id: parseInt(groupId) },
//       data: {
//         managers: {
//           connect: { id: parseInt(managerId) }
//         }
//       },
//       include: {
//         managers: true
//       }
//     });
//     res.status(200).json(group);
//   } catch (error) {
//     res.status(500).json({ error: "Error adding managers" });
//   }
// };

// export const removeManager = async (req: Request, res: Response) => {
//   try {
//     const { groupId, managerId } = req.params;
//     const group = await prisma.group.update({
//       where: { id: parseInt(groupId) },
//       data: {
//         managers: {
//           disconnect: { id: parseInt(managerId) }
//         }
//       }
//     });
//     res.json(group);
//   } catch (error) {
//     res.status(500).json({ error: "Error removing manager" });
//   }
// }; 