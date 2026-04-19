import express from 'express';
import Task from '../models/Task.js';

const router = express.Router();

// Get all tasks for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    
    const tasks = await Task.find({ userId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    
    const taskData = { ...req.body, userId };
    const newTask = new Task(taskData);
    await newTask.save();
    
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk sync all tasks (removes old, inserts new)
router.post('/bulk', async (req, res) => {
  try {
    const { userId } = req.query;
    const tasks = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    
    await Task.deleteMany({ userId });
    
    const tasksToInsert = tasks.map(t => ({...t, userId}));
    if (tasksToInsert.length > 0) {
      await Task.insertMany(tasksToInsert);
    }
    
    res.json({ message: 'Bulk sync successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    const { id } = req.params;
    
    const updatedTask = await Task.findOneAndUpdate(
      { id, userId },
      req.body,
      { new: true }
    );
    
    if (!updatedTask) return res.status(404).json({ message: 'Task not found' });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    const { id } = req.params;
    
    const deletedTask = await Task.findOneAndDelete({ id, userId });
    if (!deletedTask) return res.status(404).json({ message: 'Task not found' });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
