import { Router } from 'express';
import { verifyActiveAccount } from '../auth/auth.middleware';
import { PermissionController } from './permission.controller';
const router: Router = Router();
router.get('/', verifyActiveAccount, PermissionController.getPermissions);
export default router;
