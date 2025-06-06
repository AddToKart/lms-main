require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("colors");

// Import database and schema
const pool = require("./db/database");
const { initializeDatabase } = require("./db/schema");

// Import routes
const authRoutes = require("./routes/authRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const clientRoutes = require("./routes/clientRoutes");
const loanRoutes = require("./routes/loanRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Import security packages
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Text formatting helpers
const divider = "=".repeat(60).cyan;
const subDivider = "─".repeat(60).gray;

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet()); // Set security HTTP headers

// CORS configuration (remove duplicate)
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "http://localhost:3000"
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use("/api", apiLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

// Database initialization and server startup
const startServer = async () => {
  try {
    console.log(divider);
    console.log("🚀 Starting Loan Management System Server...".cyan.bold);
    console.log(divider);

    // Test database connection
    console.log("📊 Testing database connection...".yellow);
    await pool.execute("SELECT 1");
    console.log("   ✅ Database connection successful".green);

    // Initialize database
    console.log("🔧 Initializing database...".yellow);
    await initializeDatabase();
    console.log("   ✅ Database initialized successfully".green);

    // Start server
    const server = app.listen(PORT, () => {
      console.log(subDivider);
      console.log(`🌟 Server Status: ${"RUNNING".green.bold}`);
      console.log(
        `🌐 Environment: ${(process.env.NODE_ENV || "development").blue.bold}`
      );
      console.log(`📡 Port: ${PORT.toString().cyan.bold}`);
      console.log(
        `🔗 URL: ${"http://localhost:".white}${PORT.toString().cyan.bold}`
      );
      console.log(
        `📚 API Docs: ${"http://localhost:".white}${PORT.toString().cyan.bold}${
          "/api/health".gray
        }`
      );
      console.log(subDivider);
      console.log("🎯 API Endpoints:".yellow.bold);
      console.log(`   • Authentication: ${"/api/auth".gray}`);
      console.log(`   • Clients: ${"/api/clients".gray}`);
      console.log(`   • Loans: ${"/api/loans".gray}`);
      console.log(`   • Payments: ${"/api/payments".gray}`);
      console.log(`   • Reports: ${"/api/reports".gray}`);
      console.log(subDivider);
      console.log("✅ Server ready to serve your actual data!".green.bold);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM signal received: closing HTTP server");
      server.close(() => {
        console.log("HTTP server closed");
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:".red.bold);
    console.error(`   Error: ${error.message}`.red);
    console.log("\n🔍 Troubleshooting:".yellow);
    console.log("   • Check database connection".gray);
    console.log("   • Verify .env configuration".gray);
    console.log("   • Ensure MySQL is running".gray);
    process.exit(1);
  }
};

startServer();

module.exports = app;
