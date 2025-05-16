import { Router } from 'express';
import userController from '../controllers/user.controller';
import { verifyActiveAccount } from "../middleware/auth";

const router: Router = Router();

router.get("/", verifyActiveAccount,userController.getUsers);
router.post("/", verifyActiveAccount, userController.createUser);
router.get('/:id', verifyActiveAccount, userController.getUserById);
router.put("/:id", verifyActiveAccount, userController.updateUser);
router.delete("/:id", verifyActiveAccount, userController.deleteUser);
router.post("/:id/roles", verifyActiveAccount, userController.addRole);
router.delete("/:id/roles", verifyActiveAccount, userController.removeRole);

export default router;
