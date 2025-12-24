const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { Pool } = require('pg');
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connections
let mongoConnection = false;
let postgresConnection = false;
let redisConnection = false;

// MongoDB connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB connected successfully');
      mongoConnection = true;
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
}

// PostgreSQL connection
let pgPool = null;
if (process.env.POSTGRES_URI) {
  pgPool = new Pool({
    connectionString: process.env.POSTGRES_URI,
  });

  pgPool.connect()
    .then(() => {
      console.log('✅ PostgreSQL connected successfully');
      postgresConnection = true;
    })
    .catch((err) => {
      console.error('❌ PostgreSQL connection error:', err.message);
    });
}

// Redis connection
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({ url: process.env.REDIS_URL });

  redisClient.connect()
    .then(() => {
      console.log('✅ Redis connected successfully');
      redisConnection = true;
    })
    .catch((err) => {
      console.error('❌ Redis connection error:', err.message);
    });
}

// Simple User schema for MongoDB
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Routes
app.get('/health', (req, res) => {
  res.json({
    service: 'Node.js Express Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      mongodb: mongoConnection ? 'Connected' : 'Disconnected',
      postgresql: postgresConnection ? 'Connected' : 'Disconnected',
      redis: redisConnection ? 'Connected' : 'Disconnected'
    },
    uptime: process.uptime()
  });
});

app.get('/api/users', async (req, res) => {
  try {
    if (!mongoConnection) {
      return res.status(503).json({ error: 'MongoDB not connected' });
    }

    const users = await User.find().limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    if (!mongoConnection) {
      return res.status(503).json({ error: 'MongoDB not connected' });
    }

    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PostgreSQL example route
app.get('/api/postgres/test', async (req, res) => {
  try {
    if (!postgresConnection || !pgPool) {
      return res.status(503).json({ error: 'PostgreSQL not connected' });
    }

    const result = await pgPool.query('SELECT version()');
    res.json({
      message: 'PostgreSQL connection successful',
      version: result.rows[0].version
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Redis example route
app.get('/api/redis/test', async (req, res) => {
  try {
    if (!redisConnection || !redisClient) {
      return res.status(503).json({ error: 'Redis not connected' });
    }

    await redisClient.set('test-key', 'Hello Redis!');
    const value = await redisClient.get('test-key');

    res.json({
      message: 'Redis connection successful',
      testValue: value
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Node.js server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});