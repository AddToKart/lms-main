const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Statistics route (must come before /:id)
router.get("/stats", paymentController.getPaymentStats);

// Loan-specific payments route (must come before /:id)
router.get("/loan/:loanId", paymentController.getPaymentsByLoan);

// Main CRUD routes
router
  .route("/")
  .get(paymentController.getPayments)
  .post(paymentController.createPayment);

router
  .route("/:id")
  .get(paymentController.getPaymentById)
  .put(paymentController.updatePayment)
  .delete(restrictTo("admin"), paymentController.deletePayment);

module.exports = router;
