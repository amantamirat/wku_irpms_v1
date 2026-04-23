import { Router } from 'express';
import { checkPermission, verifyActiveAccount } from '../../auth/auth.middleware';
import { StageController } from './grant.stage.controller';
import { GrantStageService } from './grant.stage.service';
import { GrantStageRepository } from './grant.stage.repository';
import { GrantRepository } from '../grant.repository';
import { EvaluationRepository } from '../../evaluations/evaluation.repository';

const grantStageRepo = new GrantStageRepository();
const grantRepo = new GrantRepository();
const evalRepo = new EvaluationRepository();
const service = new GrantStageService(grantStageRepo, grantRepo, evalRepo);
const controller = new StageController(service);
const router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission(["grant.stage:create"]),
    controller.create
);

router.get('/:id', verifyActiveAccount,
    checkPermission(["grant.stage:read"]),
    controller.getById
);

// Get 
router.get(
    '/',
    verifyActiveAccount,
    checkPermission(["grant.stage:read"]),
    controller.get
);

// Update 
router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission(["grant.stage:update"]),
    controller.update
);

// Delete
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission(["grant.stage:delete"]),
    controller.delete
);

export default router;