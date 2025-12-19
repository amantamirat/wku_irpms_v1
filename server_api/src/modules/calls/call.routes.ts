import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { checkPermission, checkStatusPermission, verifyActiveAccount } from '../users/user.middleware';
import { CallController } from './call.controller';

const controller = new CallController();
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

router.put(
    '/:status',
    verifyActiveAccount,
    checkStatusPermission("call"),
    controller.updateStatus
);

//change status
router.put('/:id/status', verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.CHANGE_STATUS]),
    controller.changeStatus);

// Delete cycle
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.DELETE]),
    controller.delete
);

export default router;