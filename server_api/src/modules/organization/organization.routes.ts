import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { checkPermission, verifyActiveAccount } from '../users/user.middleware';
import { checkUnitPermission } from './organization.middleware';
import { OrganizationRepository } from './organization.repository';
import { OrganizationService } from './organization.service';
import { PERMISSIONS } from '../../common/constants/permissions';
// import { checkPermission } from '../users/user.middleware';
// import { PERMISSIONS } from '../../common/constants/permissions';

const router = Router();
/**
 * Dependencies
 */
const repository = new OrganizationRepository();
const service = new OrganizationService(repository);
const controller = new OrganizationController(service);

/**
 * Routes
 */
router.post(
    '/',
    verifyActiveAccount,
    checkUnitPermission('CREATE'),
    // checkPermission([PERMISSIONS.ORGANIZATION.CREATE]),
    controller.create
);

router.get(
    '/',
    verifyActiveAccount,
    controller.getAll
);

router.put(
    '/:id',
    verifyActiveAccount,
    checkUnitPermission('UPDATE'),
    // checkPermission([PERMISSIONS.ORGANIZATION.UPDATE]),
    controller.update
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkUnitPermission('DELETE'),
    //checkPermission([PERMISSIONS.ORGANIZATION.DELETE]),
    controller.delete
);

export default router;
