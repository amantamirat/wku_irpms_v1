import { Router } from 'express';

import { permissionRepo } from '../../core/container';
import { verifyAuthToken } from '../auth/auth.middleware';
import { checkPermission } from '../../core/container';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

const router: Router = Router();
const service = new PermissionService(permissionRepo);
const controller = new PermissionController(service);

router.get(
  '/',
  verifyAuthToken,
  checkPermission("permission:read"),
  controller.getPermissions
);
/*
router.put('/:id',
  verifyActiveAccount,
  checkPermission("permission:update"),
  controller.update
);
*/
router.delete('/:id',
  verifyAuthToken,
  checkPermission("permission:delete"),
  controller.delete
);

export default router;
