import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../users/user.middleware';
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

/*
router.patch('/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.APPLICANT.UPDATE_ROLES]),
    ApplicantController.updateRoles
);
*/
export default router;
