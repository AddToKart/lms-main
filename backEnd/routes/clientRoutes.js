const express = require("express");
const clientController = require("../controllers/clientController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Statistics route (must come before /:id)
router.get("/stats", clientController.getClientStats);

// Route to get clients with active loans (must come before /:id)
router.get("/with-active-loans", clientController.getClientsWithActiveLoans);

// Main CRUD routes
router
  .route("/")
  .get(clientController.getClients)
  .post(clientController.createClient);

router
  .route("/:id")
  .get(clientController.getClientById)
  .put(clientController.updateClient)
  .delete(restrictTo("admin"), clientController.deleteClient);

module.exports = router;
