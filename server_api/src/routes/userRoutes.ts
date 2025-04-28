import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticateToken } from "../middleware/auth";

const router: Router = Router();

// Routes
router.post("/login", userController.loginUser);
router.get("/", authenticateToken, userController.getUsers);
router.post("/create", authenticateToken, userController.createUser);
router.put("/update/:id", authenticateToken, userController.updateUser);
router.delete("/delete/:id", authenticateToken, userController.deleteUser);

export default router;
