import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
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
    default: ''
  },
  targetDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  progress: {
    type: Number, // 0 to 100 percentage
    default: 0
  },
  category: {
    type: String,
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, { timestamps: true });

export default mongoose.model('Goal', goalSchema);
