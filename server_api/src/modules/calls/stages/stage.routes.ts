import { Router } from 'express';
import { StageController } from './stage.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission, checkStatusPermission } from '../../users/user.middleware';
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
    checkPermission([PERMISSIONS.STAGE.CREATE]),
    controller.create
);

// Get cycles
router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STAGE.READ]),
    controller.get
);

// Update cycle
router.put(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STAGE.UPDATE]),
    controller.update
);

//update status
router.patch(
    '/:id',
    verifyActiveAccount,
    checkStatusPermission("stage"),
    controller.updateStatus
);

// Delete cycle
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STAGE.DELETE]),
    controller.delete
);

export default router;