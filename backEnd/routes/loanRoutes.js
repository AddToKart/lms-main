const express = require("express");
const loanController = require("../controllers/loanController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protect all routes
router.use(protect);

// Get loan statistics (must come before /:id route)
router.get("/stats", loanController.getLoanStats);

// Get active loans for payment dropdown
router.get("/active", loanController.getActiveLoans);

// Get all loans with filtering and pagination
router.route("/").get(loanController.getLoans).post(loanController.createLoan);

// Get a single loan by ID
router
  .route("/:id")
  .get(loanController.getLoanById)
  .put(loanController.updateLoan)
  .delete(restrictTo("admin"), loanController.deleteLoan);

// Approve a loan (admin only)
router.patch("/:id/approve", restrictTo("admin"), loanController.approveLoan);

// Reject a loan (admin only)
router.patch("/:id/reject", restrictTo("admin"), loanController.rejectLoan);

module.exports = router;
