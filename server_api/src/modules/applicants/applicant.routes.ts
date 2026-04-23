import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../auth/auth.middleware';
import { ApplicantController } from './applicant.controller';

const controller = new ApplicantController();
const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.CREATE]),
    controller.create
);

router.get('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.READ]),
    controller.get
);

router.put('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.UPDATE]),
    controller.update
);

router.put(
    '/:id/roles',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.ROLE_UPDATE]),
    controller.updateRoles
);

router.put(
    '/:id/ownerships',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.OWNERSHIP_UPDATE]),
    controller.updateOwnerships
);

router.delete('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.DELETE]),
    controller.delete
);

export default router;
