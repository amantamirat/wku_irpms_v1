import { Router } from 'express';

import { checkPermission, verifyActiveAccount } from '../users/auth/auth.middleware';
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
