import { Router } from 'express';
import { UserController } from './user.controller';
import { checkPermission, verifyActiveAccount } from './auth/auth.middleware';

const router: Router = Router();

router.post('/', verifyActiveAccount, checkPermission("user:create"), UserController.createUser);
router.get('/', verifyActiveAccount, checkPermission("user:read"), UserController.getUsers);
router.put('/:id', verifyActiveAccount, checkPermission("user:update"), UserController.updateUser);
router.delete('/:id', verifyActiveAccount, checkPermission("user:delete"), UserController.deleteUser);
router.patch("/:id/change-password", verifyActiveAccount, UserController.changePassword);
router.patch("/:id/reset-password", verifyActiveAccount, UserController.resetPassword);

export default router;
