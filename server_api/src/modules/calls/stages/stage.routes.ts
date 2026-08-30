import { Router } from 'express';
import { checkPermission, verifyActiveAccount } from '../../auth/auth.middleware';
import { StageController } from './stage.controller';
import { StageService } from './stage.service';

import { callRepo, evaluationRepo, stageRepo } from '../../../core/container';

//const stageRepo = new StageRepository();
//const callRepo = new CallRepository();
//const evalRepo = new EvaluationRepository();
const service = new StageService(stageRepo, callRepo, evaluationRepo);
const controller = new StageController(service);
const router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission(["call.stage:create"]),
    controller.create
);


router.get('/next/:id', verifyActiveAccount,
    checkPermission(["call.stage:read"]),
    controller.getNext
);


router.get('/:id', verifyActiveAccount,
    checkPermission(["call.stage:read"]),
    controller.getById
);

// Get 
router.get(
    '/',
    verifyActiveAccount,
    checkPermission(["call.stage:read"]),
    controller.get
);


// Update 
router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission(["call.stage:update"]),
    controller.update
);

// Delete
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission(["call.stage:delete"]),
    controller.delete
);

export default router;