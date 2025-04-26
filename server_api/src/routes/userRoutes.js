const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");


// Routes
router.get("/", authenticateToken, userController.getUsers);
router.post("/create", authenticateToken, userController.createUser);
router.put("/update/:id", authenticateToken, userController.updateUser);
router.delete("/delete/:id", authenticateToken, userController.deleteUser);

module.exports = router;
