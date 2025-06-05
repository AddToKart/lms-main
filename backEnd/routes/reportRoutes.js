const express = require("express");
const router = express.Router();
const {
  getLoanSummaryReport,
  getClientSummaryReport,
  getPaymentHistoryReport,
  getOverdueLoansReport,
  getDashboardAnalytics,
  exportReport,
} = require("../controllers/reportsController");
const { protect } = require("../middlewares/authMiddleware");

// Apply authentication middleware to all routes
router.use(protect);

// Report routes
router.get("/loan-summary", getLoanSummaryReport);
router.get("/client-summary", getClientSummaryReport);
router.get("/payment-history", getPaymentHistoryReport);
router.get("/overdue-loans", getOverdueLoansReport);
router.get("/dashboard-analytics", getDashboardAnalytics);
router.get("/export", exportReport);

module.exports = router;
