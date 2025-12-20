import { Router } from 'express';
import { StageController } from './stage.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission, checkStatusPermission } from '../../users/user.middleware';

const controller = new StageController();
const router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STAGE.CREATE]),
    controller.create
);

// Get cycles
router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STAGE.READ]),
    controller.get
);

// Update cycle
router.put(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STAGE.UPDATE]),
    controller.update
);

//update status
router.put(
    '/:status',
    verifyActiveAccount,
    checkStatusPermission("stage"),
    controller.updateStatus
);
// Delete cycle
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STAGE.DELETE]),
    controller.delete
);

export default router;