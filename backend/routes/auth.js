import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Register or Login (since original was very simple)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user or create one if it doesn't exist (matching original localstorage simple behavior)
    let user = await User.findOne({ username });
    
    if (!user) {
      user = new User({ username, password });
      await user.save();
    } else {
      if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }
    
    res.json({ message: 'Login successful', userId: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      username: user.username,
      theme: user.theme,
      xp: user.xp || 0,
      level: user.level || 1,
      badges: user.badges || [],
      streakDays: user.streakDays || 0,
      lastActiveDate: user.lastActiveDate || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user XP & Streaks
router.put('/:username/xp', async (req, res) => {
  try {
    const { xpToAdd, dateStr } = req.body;
    let user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.xp = (user.xp || 0) + xpToAdd;
    user.level = Math.floor(user.xp / 100) + 1;
    
    // Auto-award badges based on level
    if (user.level >= 5 && !user.badges.includes('Productivity Master')) {
        user.badges.push('Productivity Master');
    }

    // Streak Logic & Behavioral Pattern Tracking
    if (dateStr) {
      const clientDate = new Date(dateStr);
      if (!isNaN(clientDate.getTime())) {
          // Track behavioral pattern
          if (!user.mostActiveHour) user.mostActiveHour = [];
          user.mostActiveHour.push(clientDate.getHours());
          if (user.mostActiveHour.length > 50) user.mostActiveHour.shift();
          
          const today = clientDate.toISOString().split('T')[0];
          if (user.lastActiveDate) {
            const lastDate = new Date(user.lastActiveDate);
            const currDate = new Date(today);
            const diffDays = Math.floor((currDate - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) { // Consecutive day
              user.streakDays = (user.streakDays || 0) + 1;
            } else if (diffDays > 1) { // Broke streak
              user.streakDays = 1;
            }
          } else {
            user.streakDays = 1;
          }
          user.lastActiveDate = today;
      }
    }
    
    await user.save();
    
    res.json({
      xp: user.xp,
      level: user.level,
      badges: user.badges,
      streakDays: user.streakDays,
      lastActiveDate: user.lastActiveDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
