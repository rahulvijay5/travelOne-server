import express, { Express, Request, Response } from "express";
import { PrismaClient, Role } from '@prisma/client';
import cors from 'cors';
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();
const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

// User Routes
//create user by phone number and role
app.post("/users", async (req: Request, res: Response) => {
  try {
    const { phoneNumber, role = "CUSTOMER" } = req.body;
    const user = await prisma.user.create({
      data: {
        phoneNumber,
        role: role as Role
      }
    });
    res.json(user);
    console.log("New user created: ", user);
  } catch (error) {
    res.status(500).json({ error: "Error creating user" });
  }
});

// SuperAdmin Routes
//get all groups for superadmin
app.get("/admin/groups", async (req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        owner: true,
        managers: true,
        members: true,
        todos: true
      }
    });
    console.log("Groups fetched: ", groups);
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: "Error fetching groups" });
  }
});

//delete group by id
app.delete("/admin/groups/:groupId", async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    await prisma.group.delete({
      where: { id: parseInt(groupId) }
    });
    res.json({ message: "Group deleted successfully" });
    console.log("Group deleted: ", groupId);
  } catch (error) {
    res.status(500).json({ error: "Error deleting group" });
  }
});

// Owner Routes
//create group by name and owner id
app.post("/groups", async (req: Request, res: Response) => {
  try {
    const { name, ownerId } = req.body;
    const group = await prisma.group.create({
      data: {
        name,
        ownerId: parseInt(ownerId)
      },
      include: {
        owner: true
      }
    });
    res.json(group);
    console.log("Group created: ", group);
  } catch (error) {
    res.status(500).json({ error: "Error creating group" });
  }
});

//add manager to group by group id and manager id
app.post("/groups/:groupId/managers", async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { managerId } = req.body;
    
    const group = await prisma.group.update({
      where: { id: parseInt(groupId) },
      data: {
        managers: {
          connect: { id: parseInt(managerId) }
        }
      },
      include: {
        managers: true
      }
    });
    res.status(200).json(group);
    console.log("Managers added to group: ", group);
  } catch (error) {
    res.status(500).json({ error: "Error adding managers" });
  }
});

//get all groups for owner by owner id
app.get("/owners/:ownerId/groups", async (req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        ownerId: parseInt(req.params.ownerId)
      },
      include: {
        owner: true,
        managers: true,
        members: true,
        todos: true
      }
    });
    res.json(groups);
    console.log("Groups fetched: ", groups);
  } catch (error) {
    res.status(500).json({ error: "Error fetching groups" });
  }
});

//remove manager from group by group id and manager id
app.delete("/groups/:groupId/managers/:managerId", async (req: Request, res: Response) => {
  try {
    const { groupId, managerId } = req.params;
    const group = await prisma.group.update({
      where: { id: parseInt(groupId) },
      data: {
        managers: {
          disconnect: { id: parseInt(managerId) }
        }
      }
    });
    res.json(group);
    console.log("Manager removed from group: ", group);
  } catch (error) {
    res.status(500).json({ error: "Error removing manager" });
  }
});

// Manager Routes
//get all groups for manager by manager id
app.get("/managers/:managerId/groups", async (req: Request, res: Response) => {
  try {
    const { managerId } = req.params;
    const groups = await prisma.group.findMany({
      where: {
        managers: {
          some: {
            id: parseInt(managerId)
          }
        }
      },
      include: {
        members: true,
        todos: true
      }
    });
    res.json(groups);
    console.log("Manager's groups fetched: ", groups);
  } catch (error) {
    res.status(500).json({ error: "Error fetching manager's groups" });
  }
});

app.delete("/groups/:groupId/members/:memberId", async (req: Request, res: Response) => {
  try {
    const { groupId, memberId } = req.params;
    const group = await prisma.group.update({
      where: { id: parseInt(groupId) },
      data: {
        members: {
          disconnect: { id: parseInt(memberId) }
        }
      }
    });
    res.json(group);
    console.log("Member removed from group: ", group);
  } catch (error) {
    res.status(500).json({ error: "Error removing member" });
  }
});

// Customer/Member Routes
//join a group by group id and user id
app.post("/groups/:groupId/members", async (req: Request, res: Response) => {
  try {
    console.log("Joining group: ", req.params, req.body);
    const { groupId } = req.params;

    // const groupInDB = await prisma.group.findUnique({
    //   where: { id: parseInt(groupId) },
    // });
    // if (!groupInDB) {
    //   throw new Error('Group not found');
    // }
    
    const { userId } = req.body;
    const group = await prisma.group.update({
      where: { id: parseInt(groupId) },
      data: { members: { connect: { id: parseInt(userId) } } }
    });
    res.status(200).json({ success: true, group });
    console.log("User joined group: ", group);
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: "Error joining group" });
  }
});

//get usergroups by user id
app.get("/users/:userId/groups", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { id: parseInt(userId) }
        }
      }
    });
    res.json(groups);
    console.log("User's groups fetched: ", groups);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user's groups" });
  }
});

//create todo by title, group id and creator id
app.post("/groups/:groupId/todos", async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { title, creatorId } = req.body;
    
    const todo = await prisma.todo.create({
      data: {
        title,
        groupId: parseInt(groupId),
        creatorId: parseInt(creatorId)
      },
      include: {
        creator: true,
        group: true
      }
    });
    res.json(todo);
    console.log("Todo created: ", todo);
  } catch (error) {
    res.status(500).json({ error: "Error creating todo" });
  }
});

//update todo by todo id and title and status
app.put("/todos/:todoId", async (req: Request, res: Response) => {
  try {
    const { todoId } = req.params;
    const { title, status } = req.body;
    
    const todo = await prisma.todo.update({
      where: { id: parseInt(todoId) },
      data: {
        title,
        status
      }
    });
    res.json(todo);
    console.log("Todo updated: ", todo);
  } catch (error) {
    res.status(500).json({ error: "Error updating todo" });
  }
});

//delete todo by todo id
app.delete("/todos/:todoId", async (req: Request, res: Response) => {
  try {
    const { todoId } = req.params;
    await prisma.todo.delete({
      where: { id: parseInt(todoId) }
    });
    res.json({ message: "Todo deleted successfully" });
    console.log("Todo deleted: ", todoId);
  } catch (error) {
    res.status(500).json({ error: "Error deleting todo" });
  }
});

//get all todos for group by group id
app.get("/groups/:groupId/todos", async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const todos = await prisma.todo.findMany({
      where: {
        groupId: parseInt(groupId)
      },
      include: {
        creator: true
      }
    });
    res.json(todos);
    console.log("Todos fetched: ", todos);
  } catch (error) {
    res.status(500).json({ error: "Error fetching todos" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});