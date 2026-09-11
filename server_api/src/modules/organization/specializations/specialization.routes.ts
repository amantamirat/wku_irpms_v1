import { Router } from 'express';
import { SpecializationController } from './specialization.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { checkPermission } from '../../../core/container';


const controller = new SpecializationController();

const router: Router = Router();

router.post(
  '/',
  verifyAuthToken,
  checkPermission([PERMISSIONS.SPECIALIZATION.CREATE]),
  controller.create
);

router.get(
  '/',
  verifyAuthToken,
  checkPermission([PERMISSIONS.SPECIALIZATION.READ]),
  controller.get
);

router.put(
  '/:id',
  verifyAuthToken,
  checkPermission([PERMISSIONS.SPECIALIZATION.UPDATE]),
  controller.update
);

router.delete(
  '/:id',
  verifyAuthToken,
  checkPermission([PERMISSIONS.SPECIALIZATION.DELETE]),
  controller.delete
);

export default router;
