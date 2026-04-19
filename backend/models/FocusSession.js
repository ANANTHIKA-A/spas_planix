import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  taskId: {
    type: String, // optional, session might be linked to a specific task
    default: null
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  interruptionsDetected: {
    type: Number,
    default: 0
  },
  microDelaysCount: {
    type: Number,
    default: 0
  },
  attentionDriftDetected: {
    type: Boolean,
    default: false
  },
  fatigueDelta: {
    type: Number, // calculate how much fatigue was generated in this session
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('FocusSession', focusSessionSchema);
