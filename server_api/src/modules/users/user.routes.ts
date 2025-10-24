import { Router } from 'express';
import { UserController } from './user.controller';
import { checkPermission, verifyActiveAccount } from './auth/auth.middleware';
import { PERMISSIONS } from '../../util/permissions';

const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.CREATE]), 
    UserController.createUser);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.READ, PERMISSIONS.USER.CREATE, PERMISSIONS.USER.UPDATE, PERMISSIONS.USER.DELETE, PERMISSIONS.USER.RESET])
    , UserController.getUsers);
router.put('/:id', verifyActiveAccount, 
    checkPermission([PERMISSIONS.USER.UPDATE]), 
    UserController.updateUser);
router.delete('/:id', verifyActiveAccount, 
    checkPermission([PERMISSIONS.USER.DELETE]), 
    UserController.deleteUser);
router.patch("/:id/reset-password", verifyActiveAccount, 
    checkPermission([PERMISSIONS.USER.RESET]),
    UserController.resetPassword);
router.patch("/:id/change-password", verifyActiveAccount, 
    UserController.changePassword);
    
export default router;
