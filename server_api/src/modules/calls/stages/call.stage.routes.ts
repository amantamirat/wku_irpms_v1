import { Router } from 'express';
import { StageController } from './call.stage.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission, checkStatusPermission, checkTransitionPermission } from '../../auth/auth.middleware';
import { StageService } from './call.stage.service';
import { EvaluationRepository } from '../../evaluations/evaluation.repository';
import { ProjectStageRepository } from '../../projects/stages/project.stage.repository';
import { CallRepository } from '../call.repository';
import { CallStageRepository } from './call.stage.repository';
import { GrantStageRepository } from '../../grants/stages/grant.stage.repository';

const repository = new CallStageRepository();
const callRepository = new CallRepository();
const stageRepository = new GrantStageRepository();

const service = new StageService(repository, callRepository, stageRepository);
const controller = new StageController(service);
const router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission("call.stage:create"),
    controller.create
);

router.get('/:id', verifyActiveAccount,
    checkPermission("call.stage:read"),
    controller.getById
);


router.get(
    '/',
    verifyActiveAccount,
    checkPermission("call.stage:read"),
    controller.get
);


router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission("call.stage:update"),
    controller.update
);


router.patch(
    '/:id',
    verifyActiveAccount,
    checkTransitionPermission("call.stage"),
    controller.transitionState
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission("call.stage:delete"),
    controller.delete
);

export default router;