import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { checkPermission, verifyActiveAccount } from '../user.middleware';
import { PermissionController } from './permission.controller';

const router: Router = Router();
const controller = new PermissionController();

router.get(
  '/',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.PERMISSION.READ]),
  controller.getPermissions
);

export default router;
