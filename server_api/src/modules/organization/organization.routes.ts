import { Router } from 'express';
import { PERMISSIONS } from '../../util/permissions';
import { verifyActiveAccount, checkPermission } from '../users/auth/auth.middleware';
import { OrganizationController } from './organization.controller';



const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ORGANIAZTION.CREATE]),
    OrganizationController.createOrganization
);

router.get('/',
    verifyActiveAccount,
    checkPermission([
        PERMISSIONS.ORGANIAZTION.READ,
        PERMISSIONS.ORGANIAZTION.CREATE,
        PERMISSIONS.ORGANIAZTION.UPDATE,
        PERMISSIONS.ORGANIAZTION.DELETE
    ]),
    OrganizationController.getOrganizations
);

router.put('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ORGANIAZTION.UPDATE]),
    OrganizationController.updateOrganization
);

router.delete('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.ORGANIAZTION.DELETE]),
    OrganizationController.deleteOrganization
);

export default router;
