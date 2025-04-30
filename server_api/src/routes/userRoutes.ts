import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticateToken } from "../middleware/auth";

const router: Router = Router();

router.post("/", authenticateToken, userController.createUser);
router.get("/", authenticateToken, userController.getUsers);
router.get('/:id', authenticateToken, userController.getUserById);
router.put("/:id", authenticateToken, userController.updateUser);
router.delete("/:id", authenticateToken, userController.deleteUser);

export default router;
