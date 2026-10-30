import { Router } from 'express';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { applicationRepo, checkPermission, criterionRepo, resultRepo, reviewerRepo } from '../../../core/container';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { ResultController } from './result.controller';

import { ResultService } from './result.service';


const router: Router = Router();

// -----------------------
// SERVICE
// -----------------------
const service = new ResultService(
    resultRepo,
    reviewerRepo,
    criterionRepo,
    applicationRepo
);

// -----------------------
// CONTROLLER
// -----------------------
const controller = new ResultController(service);

// -----------------------
// ROUTES
// -----------------------
router.post(
    '/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.RESULT.CREATE]),
    controller.create
);

router.get(
    '/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.RESULT.READ]),
    controller.get
);

router.put(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.RESULT.UPDATE]),
    controller.update
);

router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.RESULT.DELETE]),
    controller.delete
);

export default router;