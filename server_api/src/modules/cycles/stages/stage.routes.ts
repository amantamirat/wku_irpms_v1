import { Router } from 'express';
import { StageController } from './stage.controller';
import { verifyActiveAccount, checkPermission } from '../../users/auth/auth.middleware';
import { PERMISSIONS } from '../../../util/permissions';

const router: Router = Router();

// Create Stage
router.post(
    '/',
    verifyActiveAccount,
    //checkPermission([PERMISSIONS.CALL.CREATE]),
    StageController.createStage
);

// Get all Stages (optionally by call)
router.get(
    '/',
    verifyActiveAccount,
    //checkPermission([PERMISSIONS.CALL.READ]),
    StageController.getStages
);

// Update Stage
router.put(
    '/:id',
    verifyActiveAccount,
    //checkPermission([PERMISSIONS.CALL.UPDATE]),
    StageController.updateStage
);

// Delete Stage
router.delete(
    '/:id',
    verifyActiveAccount,
    //checkPermission([PERMISSIONS.CALL.DELETE]),
    StageController.deleteStage
);

export default router;
