import { Router } from 'express';
import { checkPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { PermissionController } from './permission.controller';
import { PERMISSIONS } from '../../../util/permissions';
const router: Router = Router();
router.get('/', verifyActiveAccount, checkPermission([PERMISSIONS.PERMISSION.READ]), PermissionController.getPermissions);
export default router;
