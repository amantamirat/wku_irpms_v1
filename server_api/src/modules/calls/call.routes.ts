import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { GrantAllocationRepository } from '../grants/allocations/grant.allocation.repository';
import { GrantStageRepository } from '../grants/stages/grant.stage.repository';
import { checkPermission, checkTransitionPermission, verifyActiveAccount } from '../users/auth/auth.middleware';
import { CallController } from './call.controller';
import { CallRepository } from './call.repository';
import { CallService } from './call.service';
import { CallStageRepository } from './stages/call.stage.repository';

const repository = new CallRepository();
const grantAllocRepo = new GrantAllocationRepository();
const grantStageRepo = new GrantStageRepository();
const callStageRepo = new CallStageRepository();
const service = new CallService(repository, grantAllocRepo, grantStageRepo, callStageRepo);
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