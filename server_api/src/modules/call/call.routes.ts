import { Router } from 'express';
import { CallController } from './call.controller';
import { verifyActiveAccount, checkPermission } from '../users/auth/auth.middleware';
import { PERMISSIONS } from '../../util/permissions';

const router: Router = Router();

// Create Call
router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.CREATE]),
    CallController.createCall
);

// Get all Calls
router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.READ]),
    CallController.getCalls
);

// Get Calls for the logged-in user
router.get(
    '/user',
    verifyActiveAccount,
    checkPermission([
        PERMISSIONS.CALL.CREATE,
        PERMISSIONS.CALL.UPDATE,
        PERMISSIONS.CALL.DELETE
    ]),
    CallController.getUserCalls
);

// Update Call
router.put(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.UPDATE]),
    CallController.updateCall
);

// Delete Call
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CALL.DELETE]),
    CallController.deleteCall
);

export default router;
