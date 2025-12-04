import { Router } from 'express';
import { PERMISSIONS } from '../../util/permissions';
import { verifyActiveAccount, checkPermission } from '../users/auth/auth.middleware';
import { OrganizationController } from './organization.controller';

const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ORGANIAZTION.CREATE]),
    OrganizationController.create
);

router.get('/',
    verifyActiveAccount,
    checkPermission([
        PERMISSIONS.ORGANIAZTION.READ
    ]),
    OrganizationController.getAll
);

router.put('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ORGANIAZTION.UPDATE]),
    OrganizationController.update
);

router.delete('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ORGANIAZTION.DELETE]),
    OrganizationController.delete
);

export default router;
