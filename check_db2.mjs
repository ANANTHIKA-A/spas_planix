import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './backend/models/User.js';
import Task from './backend/models/Task.js';

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spas_db');
    
    const users = await User.find({});
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));
    
    const tasks = await Task.find({});
    console.log('--- TASKS ---');
    console.log(JSON.stringify(tasks, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDb();
