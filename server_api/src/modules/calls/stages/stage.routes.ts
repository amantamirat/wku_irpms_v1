import { Router } from 'express';
import { StageController } from './stage.controller';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { verifyActiveAccount, checkPermission } from '../../users/user.middleware';

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
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STAGE.UPDATE]),
    controller.update
);

//change status
router.put('/:id/status', verifyActiveAccount,
   checkPermission([PERMISSIONS.STAGE.CHANGE_STATUS]),
    controller.changeStatus);

// Delete cycle
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.STAGE.DELETE]),
    controller.delete
);

export default router;