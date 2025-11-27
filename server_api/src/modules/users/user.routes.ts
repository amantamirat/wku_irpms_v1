import { Router } from 'express';
import { UserController } from './user.controller';
import { checkPermission, verifyActiveAccount } from './auth/auth.middleware';
import { PERMISSIONS } from '../../util/permissions';

const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.CREATE]), 
    UserController.create);
router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.USER.READ, PERMISSIONS.USER.CREATE, PERMISSIONS.USER.UPDATE, PERMISSIONS.USER.DELETE, PERMISSIONS.USER.RESET])
    , UserController.getUsers);
router.put('/:id', verifyActiveAccount, 
    checkPermission([PERMISSIONS.USER.UPDATE]), 
    UserController.update);
router.put('/:id/status', verifyActiveAccount,
   //checkPermission([PERMISSIONS.COLLABORATOR.CHANGE_STATUS]),
    UserController.changeStatus);
router.delete('/:id', verifyActiveAccount, 
    checkPermission([PERMISSIONS.USER.DELETE]), 
    UserController.deleteUser);
router.patch("/:id/reset-password", verifyActiveAccount, 
    checkPermission([PERMISSIONS.USER.RESET]),
    UserController.resetPassword);
router.patch("/:id/change-password", verifyActiveAccount, 
    UserController.changePassword);
    
export default router;
