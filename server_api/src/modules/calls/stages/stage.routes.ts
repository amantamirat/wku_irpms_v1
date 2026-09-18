import { Router } from 'express';

import { checkPermission, checkTransitionPermission, stageService } from '../../../core/container';
import { verifyAuthToken } from '../../auth/auth.middleware';
import { StageController } from './stage.controller';

const controller = new StageController(stageService);

const router = Router();

// Create
router.post(
    '/',
    verifyAuthToken,
    checkPermission(['stage:create']),
    controller.create
);

// Get available stage
router.get(
    '/available',
    verifyAuthToken,
    checkPermission(['stage:lookup']),
    controller.getUpcoming
);

// Get previous stage
router.get(
    '/previous/:id',
    verifyAuthToken,
    checkPermission(['stage:lookup']),
    controller.getPrevious
);

/*
// Get next stage
router.get(
    '/next/:id',
    verifyAuthToken,
    checkPermission(['stage:lookup']),
    controller.getNext
);
*/
// Lookup
router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission(['stage:lookup']),
    controller.lookup
);

// Get all
router.get(
    '/',
    verifyAuthToken,
    checkPermission(['stage:read']),
    controller.get
);

// Get by ID
router.get(
    '/:id',
    verifyAuthToken,
    checkPermission(['stage:lookup']),
    controller.getById
);

// Update
router.put(
    '/:id',
    verifyAuthToken,
    checkPermission(['stage:update']),
    controller.update
);

// Update status
router.patch(
    '/:id/transition', // Often better to have a specific sub-route for transitions
    verifyAuthToken,
    checkTransitionPermission("stage"),
    controller.transitionState
);

// Delete
router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission(['stage:delete']),
    controller.delete
);

export default router;