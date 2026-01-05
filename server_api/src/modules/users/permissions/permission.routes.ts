import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { checkPermission, verifyActiveAccount } from '../user.middleware';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { PermissionRepository } from './permission.repository';

const router: Router = Router();
const repository = new PermissionRepository();
const service = new PermissionService(repository);
const controller = new PermissionController(service);

router.get(
  '/',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.PERMISSION.READ]),
  controller.getPermissions
);

export default router;
