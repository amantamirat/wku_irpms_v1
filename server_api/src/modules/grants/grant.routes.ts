import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { callRepo, compositionRepo, grantRepo, organizationRepo, projectRepo, thematicRepo } from '../../core/container';
import { verifyAuthToken } from '../auth/auth.middleware';
import { checkTransitionPermission } from '../../core/container';
import { checkPermission } from '../../core/container';
import { GrantController } from './grant.controller';
import { GrantService } from './grant.service';


const service = new GrantService(grantRepo, organizationRepo, thematicRepo,
  compositionRepo, callRepo, projectRepo
);
const controller = new GrantController(service);
const router = Router();

router.post(
  '/',
  verifyAuthToken,
  checkPermission([PERMISSIONS.GRANT.CREATE]),
  controller.create
);

router.get(
  '/lookup',
  verifyAuthToken,
  checkPermission(PERMISSIONS.GRANT.LOOKUP),
  controller.lookup
);

router.get(
  '/',
  verifyAuthToken,
  checkPermission([
    PERMISSIONS.GRANT.READ
  ]),
  controller.get
);


router.get('/:id', verifyAuthToken,
  checkPermission(PERMISSIONS.GRANT.LOOKUP),
  controller.getById);


router.put(
  '/:id',
  verifyAuthToken,
  checkPermission([PERMISSIONS.GRANT.UPDATE]),
  controller.update
);

router.patch(
  '/:id', verifyAuthToken,
  checkTransitionPermission("grant"),
  controller.transitionState
);

router.delete(
  '/:id',
  verifyAuthToken,
  checkPermission([PERMISSIONS.GRANT.DELETE]),
  controller.delete
);

export default router;
