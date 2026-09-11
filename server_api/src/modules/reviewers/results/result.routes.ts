import { Router } from 'express';
import { ResultController } from './result.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { checkPermission } from '../../../core/container';

import { ResultService } from './result.service';
import { ResultRepository } from './result.repository';
import { CriterionRepository } from '../../evaluations/criteria/criterion.repository';
import { ReviewerRepository } from '../reviewer.repository';


const router: Router = Router();

// -----------------------
// DEPENDENCIES
// -----------------------
const resultRepo = new ResultRepository();
const reviewerRepo = new ReviewerRepository();
const criterionRepo = new CriterionRepository();

// -----------------------
// SERVICE
// -----------------------
const service = new ResultService(
    resultRepo,
    reviewerRepo,
    criterionRepo
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