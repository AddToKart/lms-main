import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import morgan from "morgan";

dotenv.config();

const app = express();

// Trust proxy (important for rate limiting behind reverse proxies)
app.set("trust proxy", 1);

// Enhanced CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Logging middleware
app.use(morgan("combined"));

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// More lenient rate limiting configuration
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Increased from default (usually 100)
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs in development
  skip: (req) => {
    if (process.env.NODE_ENV === "development") {
      const ip = req.ip || req.connection.remoteAddress;
      return ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.");
    }
    return false;
  },
});

// Separate, more lenient limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Apply stricter rate limiting to auth routes
app.use("/api/auth", authLimiter);

// Import routes
const authRoutes = require("./routes/authRoutes");
const clientRoutes = require("./routes/clientRoutes");
const loanRoutes = require("./routes/loanRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);

// Health check endpoint (not rate limited)
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LMS API is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request entity too large",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
