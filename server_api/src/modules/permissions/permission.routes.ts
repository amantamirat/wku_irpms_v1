import { Router } from 'express';

import { permissionRepo } from '../../core/container';
import { checkPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

const router: Router = Router();
const service = new PermissionService(permissionRepo);
const controller = new PermissionController(service);

router.get(
  '/',
  verifyActiveAccount,
  checkPermission("permission:read"),
  controller.getPermissions
);

router.put('/:id',
  verifyActiveAccount,
  checkPermission("permission:update"),
  controller.update
);

router.delete('/:id',
  verifyActiveAccount,
  checkPermission("permission:delete"),
  controller.delete
);

export default router;
