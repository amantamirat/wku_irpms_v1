import { Router } from 'express';
import { GrantController } from './grant.controller';
import { verifyActiveAccount, checkPermission } from '../users/user.middleware';
import { PERMISSIONS } from '../../common/constants/permissions';
import { GrantRepository } from './grant.repository';
import { OrganizationRepository } from '../organization/organization.repository';
import { GrantService } from './grant.service';

const repository = new GrantRepository();
const organizationRepository = new OrganizationRepository();

const service = new GrantService(repository, organizationRepository);
const controller = new GrantController(service);
const router = Router();

router.post(
  '/',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.GRANT.CREATE]),
  controller.create
);

router.get(
  '/',
  verifyActiveAccount,
  checkPermission([
    PERMISSIONS.GRANT.READ
  ]),
  controller.get
);

router.put(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.GRANT.UPDATE]),
  controller.update
);

router.delete(
  '/:id',
  verifyActiveAccount,
  checkPermission([PERMISSIONS.GRANT.DELETE]),
  controller.delete
);

export default router;
