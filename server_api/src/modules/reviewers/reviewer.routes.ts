import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { verifyActiveAccount } from '../auth/auth.middleware';
import { checkTransitionPermission } from '../../core/container';
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
    verificationConfRepo, verificationRepo
);

const service = new ReviewerService(
    reviewerRepo, resultRepo, criterionRepo, policy, notificationService);
const controller = new ReviewerController(service);
const router: Router = Router();

router.post('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.CREATE]),
    controller.create);

router.get('/', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.READ]),
    controller.get);

router.get(
    '/me',
    verifyActiveAccount,
    controller.getMyEvaluations
);

router.put('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.UPDATE]),
    controller.update);

router.patch('/:id', verifyActiveAccount,
    checkTransitionPermission("reviewer"),
    controller.transitionState);

router.delete('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.REVIEWER.DELETE]),
    controller.delete);

export default router;
