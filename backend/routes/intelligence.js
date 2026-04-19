import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import FocusSession from '../models/FocusSession.js';

const router = express.Router();

// Helper to calculate similarity score (Jaccard similarity approximation)
function calculateSimilarity(str1, str2) {
  const set1 = new Set(str1.toLowerCase().split(' '));
  const set2 = new Set(str2.toLowerCase().split(' '));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

// 1. Intelligent Decision Support: Recommend the next best task
router.get('/recommendation/next', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const user = await User.findOne({ username: userId }); // Assuming username is userId based on context
    const tasks = await Task.find({ userId, status: 'pending' });

    if (!tasks.length) return res.json({ message: 'No pending tasks found', recommendation: null });

    // Ensure we have user fatigue level to adjust recommendation
    const fatigueMode = user?.currentFatigue > 6;

    let bestTask = null;
    let maxScore = -Infinity;

    tasks.forEach(task => {
      // Heuristic Scoring
      // 1. Priority Weight
      const priorityWeight = task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1;
      
      // 2. Deadline Urgency (if applicable)
      let urgencyScore = 0;
      if (task.deadline) {
        const timeRemaining = new Date(task.deadline) - new Date();
        const hoursRemaining = timeRemaining / (1000 * 60 * 60);
        if (hoursRemaining < 24 && hoursRemaining > 0) urgencyScore = 5;
        else if (hoursRemaining < 0) urgencyScore = 10; // Overdue
      }

      // 3. Cognitive Load vs Fatigue
      // If fatigued, punish high effort tasks
      let effortPenalty = 0;
      if (fatigueMode && task.effortLevel > 6) {
        effortPenalty = task.effortLevel * 2; 
      }

      const score = (priorityWeight * 5) + urgencyScore - effortPenalty - (task.postponedCount * 0.5);

      if (score > maxScore) {
        maxScore = score;
        bestTask = task;
      }
    });

    const reasoning = fatigueMode 
      ? `You seem tired. I recommend "${bestTask.title}" because it's a lower-effort task that still keeps you productive.`
      : `Based on priority and deadlines, "${bestTask.title}" is the optimal next task to tackle.`;

    res.json({
      recommendation: bestTask,
      confidenceScore: Math.min(0.95, 0.5 + (maxScore / 100)),
      reasoning
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 2. Predictive & Analytical Features: Efficiency Curves
router.get('/analytics/predictive', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const user = await User.findOne({ username: userId });
    
    // In a real AI model, we'd extrapolate this. Using heuristic baseline.
    const efficiencyCurve = user?.baseEnergyCurve || [3, 2, 2, 2, 2, 3, 5, 7, 8, 9, 10, 9, 8, 7, 6, 6, 7, 6, 5, 4, 3, 4, 4, 3];
    
    // Compute likelihood of completion of pending tasks based on current time
    const currentHour = new Date().getHours();
    const currentEnergy = efficiencyCurve[currentHour];
    
    const tasks = await Task.find({ userId, status: 'pending' });
    const taskPredictions = tasks.map(task => {
      // If energy is high, difficult tasks are highly likely to be completed. 
      const diffImpact = task.effortLevel > currentEnergy ? 0.2 : 0.8; 
      return {
        taskId: task.id,
        title: task.title,
        completionLikelihood: (task.completionProbability + diffImpact) / 2
      };
    });

    res.json({
      efficiencyCurve,
      currentEnergyLevel: currentEnergy,
      taskPredictions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 3. Behavioral Intelligence: Track Fatigue
router.post('/fatigue/ping', async (req, res) => {
  try {
    const { userId, activeDuration, effortIntensity } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const user = await User.findOne({ username: userId });
    if (user) {
      // Simple heuristic: increase fatigue based on duration and intensity
      const fatigueIncrease = (activeDuration / 60) * (effortIntensity / 5);
      user.currentFatigue = Math.min(10, user.currentFatigue + fatigueIncrease);
      await user.save();
      
      res.json({ message: 'Fatigue updated', currentFatigue: user.currentFatigue });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// 4. Task Intelligence: Similarity and Clustering
router.get('/similarity', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const tasks = await Task.find({ userId, status: 'pending' });
    const clusters = [];
    const processed = new Set();

    for (let i = 0; i < tasks.length; i++) {
      if (processed.has(tasks[i].id)) continue;
      
      const currentCluster = [tasks[i]];
      processed.add(tasks[i].id);

      for (let j = i + 1; j < tasks.length; j++) {
        if (processed.has(tasks[j].id)) continue;
        
        const simScore = calculateSimilarity(tasks[i].title, tasks[j].title);
        // If similarity is above 40%, cluster them
        if (simScore > 0.4 || (tasks[i].category && tasks[i].category === tasks[j].category && tasks[i].category !== 'General')) {
          currentCluster.push(tasks[j]);
          processed.add(tasks[j].id);
        }
      }
      if (currentCluster.length > 1) {
        clusters.push(currentCluster);
      }
    }

    res.json({ clusters, message: `Found ${clusters.length} similar task clusters.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
