import { Router } from 'express';
import { PERMISSIONS } from '../../util/permissions';
import { checkPermission, verifyActiveAccount } from '../users/user.middleware';
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

// Update cycle
router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.UPDATE]),
    controller.update
);

// Delete cycle
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.DELETE]),
    controller.delete
);

export default router;