import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './backend/models/User.js';
import Task from './backend/models/Task.js';

async function checkDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spas_db');
    console.log('Connected to DB');
    
    const users = await User.find({});
    console.log('Users in DB:', users.map(u => ({ username: u.username, _id: u._id })));
    
    const tasks = await Task.find({});
    console.log(`Total Tasks in DB: ${tasks.length}`);
    console.log('Sample Tasks:', tasks.slice(0, 3));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDb();
