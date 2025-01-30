// import { Request, Response } from 'express';
// import prisma from '../config/database';

// export const createTodo = async (req: Request, res: Response) => {
//   try {
//     const { groupId } = req.params;
//     const { title, creatorId } = req.body;
    
//     const todo = await prisma.todo.create({
//       data: {
//         title,
//         groupId: parseInt(groupId),
//         creatorId: parseInt(creatorId)
//       },
//       include: {
//         creator: true,
//         group: true
//       }
//     });
//     res.json(todo);
//   } catch (error) {
//     res.status(500).json({ error: "Error creating todo" });
//   }
// };

// export const updateTodo = async (req: Request, res: Response) => {
//   try {
//     const { todoId } = req.params;
//     const { title, status } = req.body;
    
//     const todo = await prisma.todo.update({
//       where: { id: parseInt(todoId) },
//       data: {
//         title,
//         status
//       }
//     });
//     res.json(todo);
//   } catch (error) {
//     res.status(500).json({ error: "Error updating todo" });
//   }
// };

// export const deleteTodo = async (req: Request, res: Response) => {
//   try {
//     const { todoId } = req.params;
//     await prisma.todo.delete({
//       where: { id: parseInt(todoId) }
//     });
//     res.json({ message: "Todo deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Error deleting todo" });
//   }
// };

// export const getGroupTodos = async (req: Request, res: Response) => {
//   try {
//     const { groupId } = req.params;
//     const todos = await prisma.todo.findMany({
//       where: {
//         groupId: parseInt(groupId)
//       },
//       include: {
//         creator: true
//       }
//     });
//     res.json(todos);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching todos" });
//   }
// }; 