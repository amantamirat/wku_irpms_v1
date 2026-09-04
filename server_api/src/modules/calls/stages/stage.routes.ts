import { Router } from 'express';
import { checkPermission, verifyActiveAccount } from '../../auth/auth.middleware';
import { StageController } from './stage.controller';
import { StageService } from './stage.service';

import { callRepo, evaluationRepo, stageRepo } from '../../../core/container';


const service = new StageService(stageRepo, callRepo, evaluationRepo);
const controller = new StageController(service);
const router = Router();

// Create
router.post(
    '/',
    verifyActiveAccount,
    checkPermission(["call.stage:create"]),
    controller.create
);

// Get upcoming
router.get(
    '/upcoming',
    verifyActiveAccount,
    // checkPermission(["call.stage:read"]),
    controller.getUpcoming
);

// Get next stage
router.get(
    '/next/:id',
    verifyActiveAccount,
    checkPermission(["call.stage:read"]),
    controller.getNext
);

// Get all
router.get(
    '/',
    verifyActiveAccount,
    checkPermission(["call.stage:read"]),
    controller.get
);

// Get by ID
router.get(
    '/:id',
    verifyActiveAccount,
    checkPermission(["call.stage:read"]),
    controller.getById
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