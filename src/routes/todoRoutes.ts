import express from 'express';
import { createTodo, updateTodo, deleteTodo, getGroupTodos } from '../controllers/todoController';
import { requireAuth } from '@clerk/express';

const router = express.Router();

// All routes are protected
router.use(requireAuth());

router.post('/groups/:groupId/todos', createTodo);
router.get('/groups/:groupId/todos', getGroupTodos);
router.put('/todos/:todoId', updateTodo);
router.delete('/todos/:todoId', deleteTodo);

export default router; 