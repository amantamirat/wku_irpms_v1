import { Router } from 'express';
import { StageController } from './stage.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission, checkStatusPermission } from '../../users/auth/auth.middleware';
import { StageService } from './stage.service';
import { EvaluationRepository } from '../../evaluations/evaluation.repository';
import { DocumentRepository } from '../../projects/documents/document.repository';
import { CallRepository } from '../call.repository';
import { StageRepository } from './stage.repository';

const repository = new StageRepository();
const callRepository = new CallRepository();
const evalRepository = new EvaluationRepository();
const docRepository = new DocumentRepository();

const service = new StageService(repository, callRepository, evalRepository, docRepository);
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
    checkStatusPermission("call.stage"),
    controller.updateStatus
);

router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission("call.stage:delete"),
    controller.delete
);

export default router;