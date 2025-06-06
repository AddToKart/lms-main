const express = require("express");

// Import the whole module first for debugging
const loanController = require("../controllers/loanController");
console.log("--- Debugging loanRoutes.js ---");
console.log(
  "Imported loanController module:",
  typeof loanController,
  Object.keys(loanController)
);
console.log(
  "Type of loanController.getLoanStats:",
  typeof loanController.getLoanStats
);
console.log("--- End Debugging loanRoutes.js ---");

// Then destructure
const {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
  approveLoan,
  rejectLoan,
  getLoanStats, // This is the function causing issues if undefined
  getClientsWithLoans,
} = loanController;

const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply protect middleware to all routes below
router.use(protect);

router.post("/", restrictTo("admin", "manager", "officer"), createLoan);
router.get("/", restrictTo("admin", "manager", "officer"), getLoans);
// This is line 14 (approx, after comments and new logs) where the error occurs if getLoanStats is undefined
router.get("/stats", restrictTo("admin", "manager"), getLoanStats);

router.get(
  "/clients",
  restrictTo("admin", "manager", "officer"),
  getClientsWithLoans
);

router.get("/:id", restrictTo("admin", "manager", "officer"), getLoanById);
router.put("/:id", restrictTo("admin", "manager"), updateLoan);
router.delete("/:id", restrictTo("admin", "manager"), deleteLoan);

router.put("/:id/approve", restrictTo("admin", "manager"), approveLoan);
router.put("/:id/reject", restrictTo("admin", "manager"), rejectLoan);

module.exports = router;
