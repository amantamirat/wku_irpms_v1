import { Router } from 'express';
import { checkPermission, verifyActiveAccount } from '../users/auth/auth.middleware';
import { CycleController } from './cycle.controller';
import { checkCyclePermission } from './cycle.middleware';
import { PERMISSIONS } from '../../util/permissions';

const router = Router();


router.post(
    '/',
    verifyActiveAccount,
    checkCyclePermission('CREATE'),
    CycleController.createCycle
);

// Get cycles
router.get(
    '/',
    verifyActiveAccount,
    checkPermission([PERMISSIONS.CYCLE.CALL.READ,
    PERMISSIONS.CYCLE.PROGRAM.READ
    ]),
    CycleController.getCycles
);

// Update cycle
router.put(
    '/:id',
    verifyActiveAccount,
    checkCyclePermission('UPDATE'),
    CycleController.updateCycle
);

// Delete cycle
router.delete(
    '/:id',
    verifyActiveAccount,
    checkCyclePermission('DELETE'),
    CycleController.deleteCycle
);

export default router;