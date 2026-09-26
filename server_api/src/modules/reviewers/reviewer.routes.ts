import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { verifyAuthToken } from '../auth/auth.middleware';
import { authPermissionService, checkTransitionPermission, filterService } from '../../core/container';
import { checkPermission } from '../../core/container';
import { CriterionRepository } from '../evaluations/criteria/criterion.repository';
import { ResultRepository } from './results/result.repository';
import { ReviewerController } from './reviewer.controller';
import { ReviewerService } from './reviewer.service';
//import { ReviewerSynchronizer } from './reviewer.synchronizer';
import { applicationRepo, collaboratorRepo, notificationService, projectRepo, reviewerRepo, stageRepo, userRepo, verificationConfRepo, verificationRepo } from '../../core/container';
import { ReviewerPolicy } from './reviewer.policy';


const resultRepo = new ResultRepository();
const criterionRepo = new CriterionRepository();


const policy = new ReviewerPolicy(reviewerRepo, projectRepo, applicationRepo, stageRepo, userRepo, collaboratorRepo,
    verificationConfRepo, verificationRepo, authPermissionService
);

const service = new ReviewerService(
    reviewerRepo, resultRepo, criterionRepo, policy, notificationService, filterService);
const controller = new ReviewerController(service);
const router: Router = Router();

router.post('/', verifyAuthToken,
    checkPermission([PERMISSIONS.REVIEWER.CREATE,
    PERMISSIONS.REVIEWER.CREATE_OWN
    ]),
    controller.create);

router.get('/', verifyAuthToken,
    checkPermission([PERMISSIONS.REVIEWER.READ,
    //PERMISSIONS.REVIEWER.READ_OWN
    ]),
    controller.get);

router.get('/lookup', verifyAuthToken,
    checkPermission([PERMISSIONS.REVIEWER.LOOKUP]),
    controller.lookup);

router.get(
    '/me',
    verifyAuthToken,
    //checkPermission([PERMISSIONS.REVIEWER.READ_OWN]),
    controller.getMyEvaluations
);

router.put('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.REVIEWER.UPDATE,
    PERMISSIONS.REVIEWER.UPDATE_OWN]),
    controller.update);

router.patch('/:id', verifyAuthToken,
    checkTransitionPermission("reviewer"),
    controller.transitionState);

router.delete('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.REVIEWER.DELETE, PERMISSIONS.REVIEWER.DELETE_OWN]),
    controller.delete);

export default router;
