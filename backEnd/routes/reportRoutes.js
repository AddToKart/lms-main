const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const {
  getLoanAnalytics,
  getLoanSummaryReport,
  getPaymentHistoryReport,
  getOverdueLoansReport,
  exportReport,
} = require("../controllers/reportsController");

// Apply authentication middleware to all routes
router.use(protect);

// Report endpoints
router.get("/loan-analytics", getLoanAnalytics);
router.get("/loan-summary", getLoanSummaryReport);
router.get("/payment-history", getPaymentHistoryReport);
router.get("/overdue-loans", getOverdueLoansReport);
router.get("/export", exportReport);

module.exports = router;
