import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { calendarRepo, callRepo, grantRepo, projectRepo } from '../../core/container';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../auth/auth.middleware';
import { CallController } from './call.controller';
import { CallService } from './call.service';


const service = new CallService(callRepo, grantRepo, calendarRepo, projectRepo);
const controller = new CallController(service);
const router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.CREATE]),
    controller.create
);
// Get cycles
router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.READ]),
    controller.get
);

router.get('/:id', verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.READ]),
    controller.getById
);
// Update call
router.put(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.UPDATE]),
    controller.update
);
// Update status
router.patch(
    '/:id/transition', // Often better to have a specific sub-route for transitions
    verifyActiveAccount,
    checkTransitionPermission("call"),
    controller.transitionState
);

// Delete cycle
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.DELETE]),
    controller.delete
);

export default router;