import { Router } from 'express';
import { SpecializationController } from './specialization.controller';
import { checkPermission, verifyActiveAccount } from '../../users/user.middleware';
import { PERMISSIONS } from '../../../util/permissions';

const controller = new SpecializationController();

const router: Router = Router();

router.post(
  '/',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.SPECIALIZATION.CREATE]),
  controller.create
);

router.get(
  '/',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.SPECIALIZATION.READ]),
  controller.get
);

router.put(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.SPECIALIZATION.UPDATE]),
  controller.update
);

router.delete(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.SPECIALIZATION.DELETE]),
  controller.delete
);

export default router;
