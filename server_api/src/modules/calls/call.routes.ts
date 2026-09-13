import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { calendarRepo, callRepo, grantRepo, projectRepo, stageService } from '../../core/container';
import { verifyAuthToken } from '../auth/auth.middleware';
import { checkTransitionPermission } from '../../core/container';
import { checkPermission } from '../../core/container';
import { CallController } from './call.controller';
import { CallService } from './call.service';

const service = new CallService(callRepo, grantRepo, calendarRepo, projectRepo, stageService);
const controller = new CallController(service);
const router = Router();

router.post(
    '/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.CALL.CREATE]),
    controller.create
);
// Lookup - currently uses the same get controller
router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission("call:lookup"),
    controller.get
);
// Get
router.get(
    '/',
    verifyAuthToken,
    checkPermission([PERMISSIONS.CALL.READ]),
    controller.get
);

router.get('/:id', verifyAuthToken,
    checkPermission("call:lookup"),
    controller.getById
);
// Update call
router.put(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.CALL.UPDATE]),
    controller.update
);
// Update status
router.patch(
    '/:id/transition', // Often better to have a specific sub-route for transitions
    verifyAuthToken,
    checkTransitionPermission("call"),
    controller.transitionState
);

// Delete cycle
router.delete(
    '/:id',
    verifyAuthToken,
    checkPermission([PERMISSIONS.CALL.DELETE]),
    controller.delete
);

export default router;