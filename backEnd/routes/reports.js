const express = require("express");
const router = express.Router();
const {
  getLoanSummaryReport,
  getClientSummaryReport,
  getPaymentHistoryReport,
  getOverdueLoansReport,
  getDashboardAnalytics,
  exportReport,
  getLoanAnalytics,
} = require("../controllers/reportsController");
const { authenticateToken } = require("../middleware/auth");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Analytics endpoint
router.get("/analytics", getDashboardAnalytics);
router.get("/loan-analytics", getLoanAnalytics);

// Individual report endpoints
router.get("/loan-summary", getLoanSummaryReport);
router.get("/client-summary", getClientSummaryReport);
router.get("/payment-history", getPaymentHistoryReport);
router.get("/overdue-loans", getOverdueLoansReport);

// Generic data endpoint for frontend
router.get("/data", async (req, res) => {
  const { type } = req.query;

  try {
    switch (type) {
      case "loanSummary":
        return await getLoanSummaryReport(req, res);
      case "clientSummary":
        return await getClientSummaryReport(req, res);
      case "paymentHistory":
        return await getPaymentHistoryReport(req, res);
      case "overdueLoans":
        return await getOverdueLoansReport(req, res);
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type",
        });
    }
  } catch (error) {
    console.error("Error fetching report data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report data",
      error: error.message,
    });
  }
});

// Export endpoint
router.get("/export", exportReport);

module.exports = router;
