import { Router } from 'express';
import { GrantController } from './grant.controller';
import { verifyActiveAccount, checkPermission } from '../users/user.middleware';
import { PERMISSIONS } from '../../util/permissions';

const router: Router = Router();

router.post(
  '/',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.GRANT.CREATE]),
  GrantController.createGrant
);

router.get(
  '/',
  verifyActiveAccount,
  checkPermission([
    PERMISSIONS.GRANT.READ
  ]),
  GrantController.getGrants
);

/*
router.get(
  '/user',
  verifyActiveAccount,
  checkPermission([
    PERMISSIONS.GRANT.CREATE,
    PERMISSIONS.GRANT.UPDATE,
    PERMISSIONS.GRANT.DELETE
  ]),
  GrantController.getUserGrants
);
*/

router.put(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.GRANT.UPDATE]),
  GrantController.updateGrant
);

router.delete(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.GRANT.DELETE]),
  GrantController.deleteGrant
);

export default router;
