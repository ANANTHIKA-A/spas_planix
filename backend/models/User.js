import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String, // In production, this would be hashed
    required: true,
  },
  theme: {
    type: String,
    default: 'dark'
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: {
    type: [String],
    default: []
  },
  streakDays: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: String,
    default: null
  },
  mostActiveHour: {
    type: [Number],
    default: []
  },
  baseEnergyCurve: {
    type: [Number], // array representing default energy for times of day (0-23 hours)
    default: [3, 2, 2, 2, 2, 3, 5, 7, 8, 9, 10, 9, 8, 7, 6, 6, 7, 6, 5, 4, 3, 4, 4, 3] // example distribution
  },
  currentFatigue: {
    type: Number, // 0 to 10
    default: 0
  },
  responsivenessScore: {
    type: Number, // 0 to 1, higher means user is more likely to interact
    default: 0.8
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
