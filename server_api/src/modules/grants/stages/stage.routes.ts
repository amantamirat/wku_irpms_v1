import { Router } from 'express';
import { checkPermission, verifyActiveAccount } from '../../users/user.middleware';
import { StageController } from './stage.controller';

const controller = new StageController();
const router = Router();

router.post(
    '/',
    verifyActiveAccount,
    checkPermission(["grant_stage:create"]),
    controller.create
);

router.get('/:id', verifyActiveAccount,
    checkPermission(["grant_stage:read"]),
    controller.getById
);

// Get 
router.get(
    '/',
    verifyActiveAccount,
    checkPermission(["grant_stage:read"]),
    controller.get
);

// Update 
router.put(
    '/',
    verifyActiveAccount,
    checkPermission(["grant_stage:update"]),
    controller.update
);

// Delete
router.delete(
    '/:id',
    verifyActiveAccount,
    checkPermission(["grant_stage:delete"]),
    controller.delete
);

export default router;