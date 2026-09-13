import { Router } from 'express';
import { checkPermission, stageService } from '../../../core/container';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { StageController } from './stage.controller';



const controller = new StageController(stageService);
const router = Router();

// Create
router.post(
    '/',
    verifyAuthToken,
    checkPermission(["stage:create"]),
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
    checkPermission(["stage:read"]),
    controller.getNext
);

// Get all
router.get(
    '/',
    verifyAuthToken,
    checkPermission(["stage:read"]),
    controller.get
);

// Get by ID
router.get(
    '/:id',
    verifyAuthToken,
    checkPermission(["stage:read"]),
    controller.getById
);

// Update
router.put(
    '/:id',
    verifyAuthToken,
    checkPermission(["stage:update"]),
    controller.update
);

// Delete
router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission(["stage:delete"]),
    controller.delete
);

export default router;