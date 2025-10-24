import { Router } from 'express';
import { PERMISSIONS } from '../../util/permissions';
import { verifyActiveAccount, checkPermission } from '../users/auth/auth.middleware';
import { ApplicantController } from './applicant.controller';

const router: Router = Router();

router.post('/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.CREATE]),
    ApplicantController.createApplicant
);

router.get('/',
    verifyActiveAccount,
    checkPermission([
        PERMISSIONS.APPLICANT.READ,
        PERMISSIONS.APPLICANT.CREATE,
        PERMISSIONS.APPLICANT.UPDATE,
        PERMISSIONS.APPLICANT.DELETE
    ]),
    ApplicantController.getApplicants
);

router.put('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.UPDATE]),
    ApplicantController.updateApplicant
);

router.delete('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.DELETE]),
    ApplicantController.deleteApplicant
);

router.patch('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.UPDATE]),
    ApplicantController.linkApplicant
);

export default router;
