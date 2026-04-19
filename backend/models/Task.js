import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  date: {
    type: String,
  },
  deadline: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  tags: {
    type: [String],
    default: []
  },
  difficulty: {
    type: String,
    enum: ['easy', 'hard'],
    default: 'easy'
  },
  completedAt: {
    type: String,
    default: null
  },
  recurring: {
    type: String,
    enum: ['none', 'daily', 'weekly'],
    default: 'none'
  },
  subtasks: {
    type: [{ title: String, completed: Boolean }],
    default: []
  },
  impactScore: {
    type: Number,
    default: 0
  },
  effortLevel: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  decisionDelay: {
    type: Number, // milliseconds between creation and completion/start
    default: 0
  },
  cognitiveLoad: {
    type: Number, // computed based on complexity and effort
    default: 0
  },
  category: {
    type: String,
    default: 'General'
  },
  postponedCount: {
    type: Number,
    default: 0
  },
  actualEffort: {
    type: Number, // minutes spent on the task
    default: 0
  },
  completionProbability: {
    type: Number, // computed chance of user completing the task (0-1)
    default: 0.5
  },
  clusterId: {
    type: String, // group similar tasks together
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
