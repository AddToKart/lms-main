require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('colors');

// Import database and migrations
const pool = require('./db/database');
const { runMigrations } = require('./db/migrations');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tokenRoutes = require('./routes/tokenRoutes');

// Import security packages
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Text formatting helpers
const divider = '='.repeat(60).cyan;
const subDivider = '─'.repeat(60).gray;

const app = express();

// Security middleware
app.use(helmet()); // Set security HTTP headers
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000' 
    : '*',
  credentials: true
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

// Apply rate limiting to auth routes
app.use('/api/auth', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10kb' })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/token', tokenRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: '🚀 Welcome to the LMS API' });
});

// API documentation route
app.get('/api', (req, res) => {
  res.json({
    message: 'LMS API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: { method: 'POST', url: '/api/auth/login', description: 'Login with username and password' },
        profile: { method: 'GET', url: '/api/auth/profile', description: 'Get current user profile (requires auth)' },
        changePassword: { method: 'POST', url: '/api/auth/change-password', description: 'Change password (requires auth)' }
      },
      token: {
        refresh: { method: 'POST', url: '/api/token/refresh', description: 'Refresh an expired JWT token' }
      }
    }
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthcheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: 'checking',
      timestamp: null,
      error: null
    },
    system: {
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      cpuUsage: process.cpuUsage()
    }
  };

  try {
    // Test database connection
    const startTime = process.hrtime();
    const [rows] = await pool.query('SELECT 1 as test');
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const responseTime = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
    
    healthcheck.database = {
      status: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
    
    res.json(healthcheck);
  } catch (error) {
    healthcheck.status = 'ERROR';
    healthcheck.database = {
      status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    res.status(503).json(healthcheck);
  }
});

// Test database route (kept for backward compatibility)
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    res.json({ success: true, message: 'Database connection successful!', data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.clear();
  
  // Server header
  console.log(divider);
  console.log(`🚀 ${'Server is running on'.gray} ${`http://localhost:${PORT}`.cyan.bold} 🚀`.padEnd(58));
  console.log(divider);
  
  // Run database migrations
  console.log('\n📝 Running database migrations...'.yellow);
  await runMigrations();
  
  // Available endpoints
  console.log('\n📡 Available Endpoints:'.yellow);
  console.log(subDivider);
  console.log(`🌐 ${'GET'.green.bold.padEnd(10)} ${`http://localhost:${PORT}/`.cyan}`.padEnd(50) + ' API Welcome Message');
  console.log(`📝 ${'GET'.green.bold.padEnd(10)} ${`http://localhost:${PORT}/api`.cyan}`.padEnd(50) + ' API Documentation');
  console.log(`💓 ${'GET'.green.bold.padEnd(10)} ${`http://localhost:${PORT}/health`.cyan}`.padEnd(50) + ' Health Check & System Status');
  console.log(`🔑 ${'POST'.green.bold.padEnd(10)} ${`http://localhost:${PORT}/api/auth/login`.cyan}`.padEnd(50) + ' Login');
  
  // Authentication instructions
  console.log('\n🔐 Authentication:'.yellow);
  console.log(subDivider);
  console.log(`👉 Default Admin Credentials:`.cyan);
  console.log(`   Username: ${'admin'.white}`);
  console.log(`   Password: ${'admin123'.white}`);
  console.log(`   (Please change this password after first login)`.gray);
  
  // Quick test instructions
  console.log('\n🔧 Quick API Test:'.yellow);
  console.log(subDivider);
  console.log(`👉 Login: ${'curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"'.gray}`);
  
  // Footer
  console.log('\n' + divider);
  console.log('💡 Tip: The server will automatically restart when you make changes'.gray);
  console.log(divider + '\n');
});
