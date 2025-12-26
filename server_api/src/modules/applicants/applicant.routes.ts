import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../users/user.middleware';
import { ApplicantController } from './applicant.controller';

const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.CREATE]),
    ApplicantController.create
);

router.get('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.READ]),
    ApplicantController.getApplicants
);

router.put('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.UPDATE]),
    ApplicantController.update
);

router.put(
    '/:id/roles',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.ROLE_UPDATE]),
    ApplicantController.updateRoles
);

router.put(
    '/:id/ownerships',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.OWNERSHIP_UPDATE]),
    ApplicantController.updateOwnerships
);

router.delete('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.DELETE]),
    ApplicantController.delete
);




export default router;
