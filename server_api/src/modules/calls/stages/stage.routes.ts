import { Router } from 'express';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { checkPermission } from '../../../core/container';
import { StageController } from './stage.controller';
import { StageService } from './stage.service';

import { callRepo, evaluationRepo, stageRepo } from '../../../core/container';


const service = new StageService(stageRepo, callRepo, evaluationRepo);
const controller = new StageController(service);
const router = Router();

// Create
router.post(
    '/',
    verifyAuthToken,
    checkPermission(["call.stage:create"]),
    controller.create
);

// Get upcoming
router.get(
    '/upcoming',
    verifyAuthToken,
    // checkPermission(["call.stage:read"]),
    controller.getUpcoming
);

// Get next stage
router.get(
    '/next/:id',
    verifyAuthToken,
    checkPermission(["call.stage:read"]),
    controller.getNext
);

// Get all
router.get(
    '/',
    verifyAuthToken,
    checkPermission(["call.stage:read"]),
    controller.get
);

// Get by ID
router.get(
    '/:id',
    verifyAuthToken,
    checkPermission(["call.stage:read"]),
    controller.getById
);

// Update
router.put(
    '/:id',
    verifyAuthToken,
    checkPermission(["call.stage:update"]),
    controller.update
);

// Delete
router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission(["call.stage:delete"]),
    controller.delete
);

export default router;