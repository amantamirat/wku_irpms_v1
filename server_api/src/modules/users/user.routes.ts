import { Router } from 'express';
import { UserController } from './user.controller';
import { verifyActiveAccount } from './auth/auth.middleware';

const router: Router = Router();

router.post('/', verifyActiveAccount, UserController.createUser);
router.get('/', verifyActiveAccount, UserController.getUsers);
router.put('/:id', verifyActiveAccount, UserController.updateUser);
router.delete('/:id', verifyActiveAccount, UserController.deleteUser);
router.patch("/:id/change-password", verifyActiveAccount, UserController.changePassword);
router.patch("/:id/reset-password", verifyActiveAccount, UserController.resetPassword);

export default router;
