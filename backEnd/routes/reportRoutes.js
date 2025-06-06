const express = require("express");
const router = express.Router();
const {
  getLoanSummaryReport,
  getPaymentHistoryReport,
  getOverdueLoansReport,
  getLoanAnalytics, // Add this line
  exportReport,
} = require("../controllers/reportsController");
const { protect } = require("../middlewares/authMiddleware");

// Apply authentication middleware to all routes
router.use(protect);

// Report routes
router.get("/loan-summary", getLoanSummaryReport);
router.get("/payment-history", getPaymentHistoryReport);
router.get("/overdue-loans", getOverdueLoansReport);
router.get("/loan-analytics", getLoanAnalytics); // Add this line
router.get("/export", exportReport);

module.exports = router;
