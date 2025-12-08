import { Router } from 'express';
import { checkPermission, verifyActiveAccount } from '../users/user.middleware';
import { OrganizationController } from './organization.controller';
import { checkUnitPermission } from './organization.middleware';
import { PERMISSIONS } from '../../util/permissions';

const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkUnitPermission('CREATE'),
    // checkPermission([PERMISSIONS.ORGANIAZTION.CREATE]),
    OrganizationController.create
);

router.get('/',
    verifyActiveAccount,
    //checkUnitPermission('READ'),
    checkPermission([PERMISSIONS.ORGANIAZTION.COLLEGE.READ,
    PERMISSIONS.ORGANIAZTION.DEPARTMENT.READ,
    PERMISSIONS.ORGANIAZTION.PROGRAM.READ,
    PERMISSIONS.ORGANIAZTION.DIRECTORATE.READ,
    PERMISSIONS.ORGANIAZTION.CENTER.READ,
    PERMISSIONS.ORGANIAZTION.EXTERNAL.READ
    ]),
    OrganizationController.getAll
);

router.put('/:id',
    verifyActiveAccount,
    checkUnitPermission('UPDATE'),
    // checkPermission([PERMISSIONS.ORGANIAZTION.UPDATE]),
    OrganizationController.update
);

router.delete('/:id',
    verifyActiveAccount,
    checkUnitPermission('DELETE'),
    //checkPermission([PERMISSIONS.ORGANIAZTION.DELETE]),
    OrganizationController.delete
);

export default router;
