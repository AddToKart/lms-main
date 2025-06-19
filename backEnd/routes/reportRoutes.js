const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const reportController = require("../controllers/reportsController");

// Apply authentication middleware to all routes
router.use(protect);

// Report endpoints
router.get("/loan-analytics", reportController.getLoanAnalytics);
router.get("/loan-summary", reportController.getLoanSummaryReport);
router.get("/payment-history", reportController.getPaymentHistoryReport);
router.get("/overdue-loans", reportController.getOverdueLoansReport);

// Export routes
router.get("/export", (req, res) => {
  const { type } = req.query;

  switch (type) {
    case "loanSummary":
      return reportController.exportLoanSummary(req, res);
    case "paymentHistory":
      return reportController.exportPaymentHistory(req, res);
    case "clientList":
      return reportController.exportClientList(req, res);
    default:
      return res.status(400).json({
        success: false,
        message: "Invalid export type specified",
      });
  }
});

module.exports = router;
